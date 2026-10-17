import { useState, useRef, useCallback, useEffect } from "react";
import { X, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/axios";

interface ImageUploaderProps {
  value: string | string[];
  fileIds?: string[];
  onChange: (value: string | string[]) => void;
  onFileIdsChange?: (fileIds: string[]) => void;
  multiple?: boolean;
  label?: string;
  maxFiles?: number;
  id?: string;
  uploadUrl?: string;
  deleteUrl?: string;
}

interface TrackedImage {
  url: string;
  fileId: string;
}

const EMPTY_FILE_IDS: string[] = [];

const ImageUploader = ({
  value,
  fileIds = EMPTY_FILE_IDS,
  onChange,
  onFileIdsChange,
  multiple = false,
  label = "Upload Image",
  maxFiles = 10,
  id = "image-uploader",
  uploadUrl = "/image/upload",
  deleteUrl = "/image/delete",
}: ImageUploaderProps) => {
  const [images, setImages] = useState<TrackedImage[]>(() => {
    const urls = multiple ? (value as string[]) || [] : value ? [value as string] : [];
    return urls.map((url, i) => ({ url, fileId: fileIds[i] || "" }));
  });
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const urls = multiple ? (value as string[]) || [] : value ? [value as string] : [];
    const newImages = urls.map((url, i) => ({ url, fileId: fileIds[i] || "" }));
    setImages((prev) => {
      const same =
        prev.length === newImages.length &&
        prev.every(
          (p, i) => p.url === newImages[i].url && p.fileId === newImages[i].fileId,
        );
      return same ? prev : newImages;
    });
  }, [value, fileIds, multiple]);

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    if (multiple && images.length + files.length > maxFiles) {
      toast.error(`You can upload up to ${maxFiles} images`);
      return;
    }

    setLoading(true);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const res = await api.post(uploadUrl, formData);

      const uploaded = res.data.data as { url: string; imageId: string }[];
      const newImages: TrackedImage[] = uploaded.map((i) => ({
        url: i.url,
        fileId: i.imageId,
      }));

      const updatedImages = multiple
        ? [...images, ...newImages]
        : newImages;

      setImages(updatedImages);
      onChange(
        multiple
          ? updatedImages.map((i) => i.url)
          : updatedImages[0]?.url || "",
      );
      onFileIdsChange?.(
        multiple
          ? updatedImages.map((i) => i.fileId)
          : updatedImages.map((i) => i.fileId),
      );
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (img: TrackedImage) => {
    try {
      if (img.fileId) {
        await api.post(deleteUrl, { fileId: img.fileId });
      }
      const updated = images.filter((i) => i.url !== img.url);
      setImages(updated);
      onChange(
        multiple ? updated.map((i) => i.url) : updated[0]?.url || "",
      );
      onFileIdsChange?.(
        multiple ? updated.map((i) => i.fileId) : updated.map((i) => i.fileId),
      );
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Delete failed");
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length) {
        handleFileUpload(droppedFiles);
      }
    },
    [images, multiple, maxFiles],
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-300 dark:border-zinc-700 shadow-sm space-y-4">
      <label className="text-sm font-semibold block text-gray-900 dark:text-gray-100">
        {label}
      </label>

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        className="hidden"
        id={id}
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          flex flex-col items-center justify-center gap-3 p-8 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200
          ${
            isDragOver
              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
              : "border-gray-300 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800"
          }
        `}
      >
        {loading ? (
          <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Loader2 className="animate-spin h-5 w-5" /> Uploading...
          </span>
        ) : (
          <>
            <Upload
              size={28}
              className={`${
                isDragOver
                  ? "text-blue-500 dark:text-blue-400"
                  : "text-gray-400 dark:text-zinc-500"
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isDragOver
                ? "Drop images here"
                : multiple
                  ? "Drag & drop images here, or click to browse"
                  : "Drag & drop an image here, or click to browse"}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              {multiple ? `Up to ${maxFiles} files` : "Single image"}
            </span>
          </>
        )}
      </div>

      {/* Preview Section */}
      {images.length > 0 && (
        <div
          className={`grid gap-4 ${
            multiple ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative w-full border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 ${
                multiple ? "h-40" : "h-[40vh]"
              }`}
            >
              <img
                src={img.url}
                alt={`Preview ${idx}`}
                className="object-contain h-full w-full"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(img);
                }}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black transition"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
