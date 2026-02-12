'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Lesson } from '../../lib/lms/types';

interface LessonPlayerProps {
  lesson: Lesson;
  onComplete?: () => void;
}

function isYouTubeUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

function isVimeoUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?vimeo\.com\//i.test(url);
}

function getYouTubeEmbedUrl(url: string): string {
  let videoId = '';
  const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
  if (shortMatch) {
    videoId = shortMatch[1];
  } else {
    const longMatch = url.match(/[?&]v=([^&#]+)/);
    if (longMatch) {
      videoId = longMatch[1];
    }
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}

function getVimeoEmbedUrl(url: string): string {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const videoId = match ? match[1] : '';
  return `https://player.vimeo.com/video/${videoId}?dnt=1`;
}

function VideoPlayer({ url, title }: { url: string; title: string }) {
  if (isYouTubeUrl(url)) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={getYouTubeEmbedUrl(url)}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isVimeoUrl(url)) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          src={getVimeoEmbedUrl(url)}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        src={url}
        title={title}
        className="h-full w-full"
        controls
        controlsList="nodownload"
        preload="metadata"
      >
        <track kind="captions" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function TextContent({ html }: { html: string }) {
  return (
    <div className="overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div
        className="prose prose-gray max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-img:rounded-lg prose-pre:bg-gray-900 prose-pre:text-gray-100"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function PdfViewer({ url, title }: { url: string; title: string }) {
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-16 px-4">
        <svg
          className="mb-4 h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mb-3 text-sm text-gray-600">
          Unable to display the PDF inline.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download PDF
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <iframe
        src={url}
        title={title}
        className="h-[70vh] w-full min-h-[500px]"
        onError={() => setLoadError(true)}
      />
    </div>
  );
}

export default function LessonPlayer({ lesson, onComplete }: LessonPlayerProps) {
  const [completed, setCompleted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMarkComplete = useCallback(() => {
    if (!completed) {
      setCompleted(true);
      onComplete?.();
    }
  }, [completed, onComplete]);

  useEffect(() => {
    setCompleted(false);
  }, [lesson.id]);

  const renderContent = () => {
    switch (lesson.type) {
      case 'VIDEO': {
        if (!lesson.contentUrl) {
          return (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-20">
              <p className="text-sm text-gray-500">No video URL provided for this lesson.</p>
            </div>
          );
        }
        return <VideoPlayer url={lesson.contentUrl} title={lesson.title} />;
      }

      case 'TEXT': {
        const content = lesson.contentText ?? '';
        if (!content) {
          return (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-20">
              <p className="text-sm text-gray-500">No content available for this lesson.</p>
            </div>
          );
        }
        return <TextContent html={content} />;
      }

      case 'PDF': {
        if (!lesson.contentUrl) {
          return (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-20">
              <p className="text-sm text-gray-500">No PDF URL provided for this lesson.</p>
            </div>
          );
        }
        return <PdfViewer url={lesson.contentUrl} title={lesson.title} />;
      }

      case 'QUIZ': {
        return (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-20">
            <p className="text-sm text-gray-500">
              This lesson contains a quiz. Please use the quiz component to take it.
            </p>
          </div>
        );
      }

      default: {
        return (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-20">
            <p className="text-sm text-gray-500">Unsupported lesson type.</p>
          </div>
        );
      }
    }
  };

  return (
    <div ref={contentRef} className="flex flex-col gap-4">
      {/* Lesson header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{lesson.title}</h2>
          {lesson.description && (
            <p className="mt-1 text-sm text-gray-600">{lesson.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-medium uppercase">
              {lesson.type}
            </span>
            {lesson.duration > 0 && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {lesson.duration} min
              </span>
            )}
            {lesson.isFree && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Free Preview
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      {renderContent()}

      {/* Complete button */}
      {onComplete && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleMarkComplete}
            disabled={completed}
            className={`inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors ${
              completed
                ? 'cursor-not-allowed bg-green-100 text-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {completed ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Completed
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
                Mark as Complete
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
