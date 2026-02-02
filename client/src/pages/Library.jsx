import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Image, Upload, Trash2, Brain, Eye } from 'lucide-react';
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Library</h1>
          <p className="text-gray-500 text-sm">Manage your study materials</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg font-medium text-sm"
        >
          <Upload className="w-5 h-5" />
          Upload File
        </button>
      </div>

      {/* Materials Grid */}
      {data?.length === 0 ? (
        <div className="text-center py-12 lg:py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <Upload className="w-14 h-14 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No materials yet</h3>
          <p className="text-gray-500 mb-6 text-sm">Upload your first PDF or image to get started</p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors text-sm font-medium"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {data?.map((material) => (
            <div
              key={material._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${material.type === 'pdf' ? 'bg-gradient-to-br from-blue-50 to-blue-100' : 'bg-gradient-to-br from-green-50 to-green-100'} rounded-lg`}>
                  {material.type === 'pdf' ? (
                    <FileText className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Image className="w-6 h-6 text-green-600" />
                  )}
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mb-2 truncate">{material.title}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {new Date(material.createdAt).toLocaleDateString()}
              </p>

              <div className="flex gap-2">
                <Link
                  to={`/workspace/${workspaceId}/material/${material._id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm rounded-lg transition-all font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Study
                </Link>
                {material.type === 'pdf' && material.transcribedText && (
                  <button
                    onClick={() => handleGenerateFlashcards(material._id)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
                    title="Generate Flashcards"
                  >
                    <Brain className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(material._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  title="Delete"
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
