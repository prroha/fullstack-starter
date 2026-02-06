import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/services/upload_service.dart';

// =============================================================================
// Types
// =============================================================================

/// File source type
enum FileSourceType {
  camera,
  gallery,
  files,
}

/// Picked file with metadata
class PickedFile {
  final String id;
  final File file;
  final String name;
  final int size;
  final String? mimeType;

  const PickedFile({
    required this.id,
    required this.file,
    required this.name,
    required this.size,
    this.mimeType,
  });
}

// =============================================================================
// File Picker Widget
// =============================================================================

/// A widget for picking files from camera, gallery, or file system
class FilePickerWidget extends StatefulWidget {
  /// Maximum file size in bytes
  final int maxFileSize;

  /// Allowed file extensions (e.g., ['jpg', 'png', 'pdf'])
  final List<String>? allowedExtensions;

  /// Allow multiple file selection
  final bool allowMultiple;

  /// Maximum number of files when allowMultiple is true
  final int maxFiles;

  /// Called when files are selected
  final void Function(List<PickedFile> files)? onFilesSelected;

  /// Called when an error occurs
  final void Function(String error)? onError;

  /// Custom label text
  final String? label;

  /// Custom helper text
  final String? helperText;

  /// Show camera option
  final bool showCameraOption;

  /// Show gallery option
  final bool showGalleryOption;

  /// Show file picker option
  final bool showFilesOption;

  /// Custom decoration
  final BoxDecoration? decoration;

  /// Custom height
  final double? height;

  const FilePickerWidget({
    super.key,
    this.maxFileSize = 10 * 1024 * 1024, // 10MB
    this.allowedExtensions,
    this.allowMultiple = false,
    this.maxFiles = 10,
    this.onFilesSelected,
    this.onError,
    this.label,
    this.helperText,
    this.showCameraOption = true,
    this.showGalleryOption = true,
    this.showFilesOption = true,
    this.decoration,
    this.height,
  });

  @override
  State<FilePickerWidget> createState() => _FilePickerWidgetState();
}

class _FilePickerWidgetState extends State<FilePickerWidget> {
  final List<PickedFile> _selectedFiles = [];
  final ImagePicker _imagePicker = ImagePicker();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Picker area
        GestureDetector(
          onTap: _showSourcePicker,
          child: Container(
            height: widget.height ?? 150,
            decoration: widget.decoration ??
                BoxDecoration(
                  border: Border.all(
                    color: theme.colorScheme.outline,
                    width: 2,
                    style: BorderStyle.solid,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.3),
                ),
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(),
                  )
                : _buildPickerContent(theme),
          ),
        ),

        // Selected files list
        if (_selectedFiles.isNotEmpty) ...[
          const SizedBox(height: 12),
          ..._selectedFiles.map((file) => _buildFileItem(file, theme)),
        ],
      ],
    );
  }

  Widget _buildPickerContent(ThemeData theme) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.cloud_upload_outlined,
          size: 40,
          color: theme.colorScheme.primary,
        ),
        const SizedBox(height: 8),
        Text(
          widget.label ?? 'Tap to select files',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.primary,
            fontWeight: FontWeight.w500,
          ),
        ),
        if (widget.helperText != null) ...[
          const SizedBox(height: 4),
          Text(
            widget.helperText!,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ] else ...[
          const SizedBox(height: 4),
          Text(
            'Max ${formatFileSize(widget.maxFileSize)} per file',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildFileItem(PickedFile file, ThemeData theme) {
    final isImage = isImageFile(file.name);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          // Thumbnail or icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(8),
            ),
            child: isImage
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      file.file,
                      fit: BoxFit.cover,
                    ),
                  )
                : Icon(
                    _getFileIcon(file.name),
                    color: theme.colorScheme.primary,
                  ),
          ),
          const SizedBox(width: 12),

          // File info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  file.name,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  formatFileSize(file.size),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          // Remove button
          IconButton(
            onPressed: () => _removeFile(file),
            icon: Icon(
              Icons.close,
              color: theme.colorScheme.error,
            ),
            iconSize: 20,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        ],
      ),
    );
  }

  void _showSourcePicker() {
    final sources = <FileSourceType>[];
    if (widget.showCameraOption) sources.add(FileSourceType.camera);
    if (widget.showGalleryOption) sources.add(FileSourceType.gallery);
    if (widget.showFilesOption) sources.add(FileSourceType.files);

    if (sources.length == 1) {
      _pickFiles(sources.first);
      return;
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.showCameraOption)
                ListTile(
                  leading: const Icon(Icons.camera_alt),
                  title: const Text('Take a photo'),
                  onTap: () {
                    Navigator.pop(context);
                    _pickFiles(FileSourceType.camera);
                  },
                ),
              if (widget.showGalleryOption)
                ListTile(
                  leading: const Icon(Icons.photo_library),
                  title: const Text('Choose from gallery'),
                  onTap: () {
                    Navigator.pop(context);
                    _pickFiles(FileSourceType.gallery);
                  },
                ),
              if (widget.showFilesOption)
                ListTile(
                  leading: const Icon(Icons.folder),
                  title: const Text('Browse files'),
                  onTap: () {
                    Navigator.pop(context);
                    _pickFiles(FileSourceType.files);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickFiles(FileSourceType source) async {
    setState(() => _isLoading = true);

    try {
      List<PickedFile> newFiles = [];

      switch (source) {
        case FileSourceType.camera:
          final image = await _imagePicker.pickImage(
            source: ImageSource.camera,
            maxWidth: 1920,
            maxHeight: 1080,
          );
          if (image != null) {
            final file = File(image.path);
            newFiles.add(PickedFile(
              id: DateTime.now().millisecondsSinceEpoch.toString(),
              file: file,
              name: image.name,
              size: await file.length(),
              mimeType: 'image/jpeg',
            ));
          }
          break;

        case FileSourceType.gallery:
          if (widget.allowMultiple) {
            final images = await _imagePicker.pickMultiImage(
              maxWidth: 1920,
              maxHeight: 1080,
            );
            for (final image in images) {
              final file = File(image.path);
              newFiles.add(PickedFile(
                id: DateTime.now().millisecondsSinceEpoch.toString() +
                    newFiles.length.toString(),
                file: file,
                name: image.name,
                size: await file.length(),
              ));
            }
          } else {
            final image = await _imagePicker.pickImage(
              source: ImageSource.gallery,
              maxWidth: 1920,
              maxHeight: 1080,
            );
            if (image != null) {
              final file = File(image.path);
              newFiles.add(PickedFile(
                id: DateTime.now().millisecondsSinceEpoch.toString(),
                file: file,
                name: image.name,
                size: await file.length(),
              ));
            }
          }
          break;

        case FileSourceType.files:
          final result = await FilePicker.platform.pickFiles(
            allowMultiple: widget.allowMultiple,
            type: widget.allowedExtensions != null
                ? FileType.custom
                : FileType.any,
            allowedExtensions: widget.allowedExtensions,
          );

          if (result != null) {
            for (final platformFile in result.files) {
              if (platformFile.path != null) {
                final file = File(platformFile.path!);
                newFiles.add(PickedFile(
                  id: DateTime.now().millisecondsSinceEpoch.toString() +
                      newFiles.length.toString(),
                  file: file,
                  name: platformFile.name,
                  size: platformFile.size,
                ));
              }
            }
          }
          break;
      }

      // Validate files
      final validFiles = <PickedFile>[];
      final errors = <String>[];

      for (final file in newFiles) {
        // Check file size
        if (file.size > widget.maxFileSize) {
          errors.add('${file.name} exceeds size limit');
          continue;
        }

        // Check extension if specified
        if (widget.allowedExtensions != null) {
          final ext = file.name.split('.').last.toLowerCase();
          if (!widget.allowedExtensions!.contains(ext)) {
            errors.add('${file.name} has invalid file type');
            continue;
          }
        }

        validFiles.add(file);
      }

      // Check max files limit
      final availableSlots = widget.allowMultiple
          ? widget.maxFiles - _selectedFiles.length
          : 1;

      if (validFiles.length > availableSlots) {
        errors.add('Can only add $availableSlots more file(s)');
        validFiles.removeRange(availableSlots, validFiles.length);
      }

      // Report errors
      if (errors.isNotEmpty) {
        widget.onError?.call(errors.join('. '));
      }

      // Add valid files
      if (validFiles.isNotEmpty) {
        setState(() {
          if (widget.allowMultiple) {
            _selectedFiles.addAll(validFiles);
          } else {
            _selectedFiles.clear();
            _selectedFiles.add(validFiles.first);
          }
        });

        widget.onFilesSelected?.call(_selectedFiles);
      }
    } catch (e) {
      widget.onError?.call('Failed to pick files: ${e.toString()}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _removeFile(PickedFile file) {
    setState(() {
      _selectedFiles.removeWhere((f) => f.id == file.id);
    });
    widget.onFilesSelected?.call(_selectedFiles);
  }

  IconData _getFileIcon(String fileName) {
    final ext = fileName.split('.').last.toLowerCase();

    switch (ext) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'doc':
      case 'docx':
        return Icons.description;
      case 'xls':
      case 'xlsx':
        return Icons.table_chart;
      case 'ppt':
      case 'pptx':
        return Icons.slideshow;
      case 'txt':
        return Icons.text_snippet;
      case 'zip':
      case 'rar':
        return Icons.folder_zip;
      default:
        return Icons.insert_drive_file;
    }
  }

  /// Get selected files (for external access)
  List<PickedFile> get selectedFiles => List.unmodifiable(_selectedFiles);

  /// Clear all selected files (for external access)
  void clearFiles() {
    setState(() {
      _selectedFiles.clear();
    });
    widget.onFilesSelected?.call([]);
  }
}

// =============================================================================
// Compact File Picker Widget
// =============================================================================

/// A compact file picker widget suitable for inline use
class CompactFilePicker extends StatelessWidget {
  final VoidCallback onTap;
  final String label;
  final IconData? icon;
  final bool isLoading;

  const CompactFilePicker({
    super.key,
    required this.onTap,
    this.label = 'Select file',
    this.icon,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: isLoading ? null : onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: theme.colorScheme.outline),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isLoading)
              const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else
              Icon(
                icon ?? Icons.attach_file,
                size: 20,
                color: theme.colorScheme.primary,
              ),
            const SizedBox(width: 8),
            Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
