import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Image, Upload, Trash2, Brain, Eye, Search, Grid, List, FolderOpen } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import UploadModal from '../components/UploadModal';

const Library = () => {
  const { workspaceId } = useParams();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredMaterials = data?.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Library</h1>
          <p className="text-sm text-gray-500">{data?.length || 0} materials</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          />
        </div>
        <div className="flex border border-gray-200 rounded-lg bg-white">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredMaterials.length === 0 && !searchQuery ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No materials yet</h3>
          <p className="text-sm text-gray-500 mb-4">Upload your first PDF or image to get started</p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Material
          </button>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No results found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <div key={material._id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${material.type === 'pdf' ? 'bg-blue-50' : 'bg-green-50'}`}>
                  {material.type === 'pdf' ? (
                    <FileText className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Image className="w-5 h-5 text-green-600" />
                  )}
                </div>
                {material.isProcessed && (
                  <span className="text-xs text-green-600 font-medium">AI Ready</span>
                )}
              </div>

              <h3 className="font-medium text-gray-900 mb-1 truncate">{material.title}</h3>
              <p className="text-xs text-gray-500 mb-4">
                {new Date(material.createdAt).toLocaleDateString()} · {material.type.toUpperCase()}
              </p>

              <div className="flex gap-2">
                <Link
                  to={`/workspace/${workspaceId}/material/${material._id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Study
                </Link>
                {material.type === 'pdf' && material.transcribedText && (
                  <button
                    onClick={() => handleGenerateFlashcards(material._id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Generate Flashcards"
                  >
                    <Brain className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(material._id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMaterials.map((material) => (
            <div key={material._id} className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${material.type === 'pdf' ? 'bg-blue-50' : 'bg-green-50'}`}>
                {material.type === 'pdf' ? (
                  <FileText className="w-5 h-5 text-blue-600" />
                ) : (
                  <Image className="w-5 h-5 text-green-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm truncate">{material.title}</h3>
                <p className="text-xs text-gray-500">{new Date(material.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {material.isProcessed && (
                  <span className="text-xs text-green-600 font-medium">AI Ready</span>
                )}
                <Link
                  to={`/workspace/${workspaceId}/material/${material._id}`}
                  className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Study
                </Link>
                <button
                  onClick={() => handleDelete(material._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
