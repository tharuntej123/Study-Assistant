import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Image, Upload, Trash2, Brain } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import UploadModal from '../components/UploadModal';

const Library = () => {
  const { workspaceId } = useParams();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['materials', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/materials`);
      return response.data.materials;
    },
  });

  const handleDelete = async (materialId) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      await api.delete(`/workspaces/${workspaceId}/materials/${materialId}`);
      toast.success('Material deleted');
      refetch();
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  const handleGenerateFlashcards = async (materialId) => {
    try {
      await api.post(`/workspaces/${workspaceId}/flashcards/generate`, { materialId });
      toast.success('Flashcards generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate flashcards');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Library</h1>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Upload className="w-5 h-5" />
          Upload File
        </button>
      </div>

      {/* Materials Grid */}
      {data?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No materials yet</h3>
          <p className="text-gray-500">Upload your first PDF or image to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.map((material) => (
            <div
              key={material._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  {material.type === 'pdf' ? (
                    <FileText className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Image className="w-6 h-6 text-green-600" />
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 truncate">{material.title}</h3>
              <p className="text-sm text-gray-500 mb-4">
                Uploaded {new Date(material.createdAt).toLocaleDateString()}
              </p>

              <div className="flex gap-2">
                {material.type === 'pdf' && material.transcribedText && (
                  <button
                    onClick={() => handleGenerateFlashcards(material._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Brain className="w-4 h-4" />
                    Flashcards
                  </button>
                )}
                <button
                  onClick={() => handleDelete(material._id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        workspaceId={workspaceId}
        onUploadSuccess={refetch}
      />
    </div>
  );
};

export default Library;
