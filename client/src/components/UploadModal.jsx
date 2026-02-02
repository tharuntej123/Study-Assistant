import { useState } from 'react';
import { X, Upload, FileText, Image, Loader2 } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const UploadModal = ({ isOpen, onClose, workspaceId, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Only PDF and image files are allowed');
      return;
    }

    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    setUploading(true);

    try {
      await api.post(`/workspaces/${workspaceId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('File uploaded successfully!');
      onUploadSuccess?.();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setUploading(false);
    onClose();
  };

  const isPdf = file?.type === 'application/pdf';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Upload Material</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-6 mb-4 text-center transition-colors ${
              dragActive
                ? 'border-gray-400 bg-gray-50'
                : file
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 ${isPdf ? 'bg-blue-50' : 'bg-green-50'} rounded-lg flex items-center justify-center mb-3`}>
                  {isPdf ? (
                    <FileText className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Image className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <p className="font-medium text-gray-900 text-sm mb-0.5">{file.name}</p>
                <p className="text-xs text-gray-500 mb-2">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Change file
                </button>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-sm text-gray-700 mb-1">Drop your file here</p>
                <p className="text-xs text-gray-500 mb-3">PDF, JPG, or PNG (max 10MB)</p>
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg text-sm cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  Browse Files
                </label>
              </>
            )}
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
          </div>

          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Material title"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              disabled={uploading}
            />
          </div>

          {/* AI Note */}
          <p className="text-xs text-gray-500 mb-4">
            AI will generate a summary and flashcards after upload.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
