'use client';

import { useState, useEffect, useCallback } from 'react';
import { quickVidApi, projectsApi } from '../../../utils/apiClient';
import { QuickVidState, VideoHistoryItem, Project } from '../../../types';

export default function QuickVidPage() {
  const [state, setState] = useState<QuickVidState>({
    description: '',
    isLoading: false,
    videoUrl: null,
    error: null,
    videoInfo: null,
    // New fields for multi-video support
    sessionId: null,
    totalScenes: null,
    sceneVideos: [],
    mergedVideo: null,
    youTubeVideo: null,
  });

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mergedVideoError, setMergedVideoError] = useState(false);
  const [mergedVideoRetryCount, setMergedVideoRetryCount] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; videoId: string; videoDescription: string }>({
    show: false,
    videoId: '',
    videoDescription: ''
  });

  const loadVideoHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    
    try {
      const response = await quickVidApi.getVideoHistory(10, 0);
      if (response.success && response.data) {
        setVideoHistory(response.data.videos);
      } else {
        setHistoryError(response.error || 'Failed to load video history');
      }
    } catch (error: any) {
      setHistoryError('Failed to load video history');
    } finally {
      setHistoryLoading(false);
    }
  }, []); // Empty dependency array - function doesn't depend on any props or state

  const handleDeleteVideo = (videoId: string, videoDescription: string) => {
    setDeleteConfirm({
      show: true,
      videoId,
      videoDescription: videoDescription.length > 50 
        ? `${videoDescription.substring(0, 50)}...` 
        : videoDescription
    });
  };

  const confirmDeleteVideo = async () => {
    try {
      setIsDeleting(true);
      const response = await quickVidApi.deleteVideo(deleteConfirm.videoId);
      if (response.success) {
        // Remove video from local state
        setVideoHistory(prev => prev.filter(video => video.id !== deleteConfirm.videoId));
        setDeleteConfirm({ show: false, videoId: '', videoDescription: '' });
      } else {
        alert(response.error || 'Failed to delete video');
      }
    } catch (error: any) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteVideo = () => {
    if (isDeleting) return;
    setDeleteConfirm({ show: false, videoId: '', videoDescription: '' });
  };

  const loadProjects = useCallback(async () => {
    // Don't reload if already loading or if we have projects
    if (projectsLoading || projects.length > 0) return;
    
    try {
      setProjectsLoading(true);
      const response = await projectsApi.getProjects();
      if (response.success) {
        setProjects(response.data);
      } else {
        console.error('Error loading projects:', response.error);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  }, [projectsLoading, projects.length]);

  const handleProjectSelect = (project: Project | null) => {
    setSelectedProject(project);
    setIsDropdownOpen(false);
  };

  // Load video history and projects on page mount
  useEffect(() => {
    loadVideoHistory();
    loadProjects();
  }, [loadVideoHistory, loadProjects]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isDropdownOpen && !target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.description.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a description' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      videoUrl: null 
    }));

    // Start countdown timer (n8n workflow takes ~90-120 seconds for multi-video generation)
    setTimeRemaining(120);
    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const response = await quickVidApi.generateVideo({
        description: state.description.trim(),
        projectId: selectedProject?.id,
        projectData: selectedProject || undefined,
      });

      if (response.success) {
        // Check if it's a processing status
        if (response.status === 'processing') {
          setState(prev => ({ 
            ...prev, 
            error: `${response.message}\n\nPlease wait while we process your video...`, 
            isLoading: false 
          }));
          return;
        }

        // Handle new multi-video response format
        if (response.status === 'done' && response.mergedVideo) {
          // Clear progress bar immediately when response is received
          clearInterval(countdownInterval);
          setTimeRemaining(null);
          // Reset video error state for new video
          setMergedVideoError(false);
          setMergedVideoRetryCount(0);
          setState(prev => ({
            ...prev,
            videoUrl: response.mergedVideo || null, // Keep for backward compatibility
            videoInfo: response.data?.videoInfo || null,
            isLoading: false,
            // New multi-video fields
            sessionId: response.sessionId || null,
            totalScenes: response.totalScenes || 0,
            sceneVideos: response.sceneVideos || [],
            mergedVideo: response.mergedVideo || null,
            youTubeVideo: response.youTubeVideo || null,
          }));
          // Refresh video history after successful generation
          loadVideoHistory();
        } else {
          // Clear progress bar when no video URL found
          clearInterval(countdownInterval);
          setTimeRemaining(null);
          setState(prev => ({ 
            ...prev, 
            error: 'Video generated but no URL found. Please try again.', 
            isLoading: false 
          }));
        }
      } else {
        // Clear progress bar on error too
        clearInterval(countdownInterval);
        setTimeRemaining(null);
        setState(prev => ({ 
          ...prev, 
          error: response.error || 'Failed to generate video', 
          isLoading: false 
        }));
      }
    } catch (error: any) {
      clearInterval(countdownInterval);
      setTimeRemaining(null);
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'An unexpected error occurred';
      setState(prev => ({ 
        ...prev, 
        error: `Error: ${errorMessage}`, 
        isLoading: false 
      }));
    }
  };

  const handleReset = () => {
    setTimeRemaining(null);
    setMergedVideoError(false);
    setMergedVideoRetryCount(0);
    setState({
      description: '',
      isLoading: false,
      videoUrl: null,
      error: null,
      videoInfo: null,
      // Reset new multi-video fields
      sessionId: null,
      totalScenes: null,
      sceneVideos: [],
      mergedVideo: null,
      youTubeVideo: null,
    });
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ 
        background: '#18181b', 
        padding: 40, 
        borderRadius: 12, 
        boxShadow: '0 4px 32px #0004',
        minHeight: '60vh'
      }}>
        <h1 style={{ 
          color: '#fff', 
          fontSize: 28, 
          fontWeight: 700, 
          marginBottom: 8, 
          textAlign: 'center' 
        }}>
          Quick Vid
        </h1>
            <p style={{
              color: '#a1a1aa',
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 32
            }}>
              Generate a video from your description using AI<br />
              <span style={{ fontSize: 14, color: '#6b7280' }}>
                Video generation takes around 90-120 seconds
              </span>
            </p>

        {/* Projects Dropdown */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12
          }}>
            <label style={{
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.025em',
              margin: 0
            }}>
              🎬 Select a Project (Optional)
            </label>
            <button
              type="button"
              onClick={loadProjects}
              disabled={projectsLoading}
              style={{
                background: 'transparent',
                border: '1px solid #374151',
                color: '#9ca3af',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: projectsLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: projectsLoading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              onMouseEnter={(e) => {
                if (!projectsLoading) {
                  e.currentTarget.style.borderColor = '#4b5563';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!projectsLoading) {
                  e.currentTarget.style.borderColor = '#374151';
                  e.currentTarget.style.color = '#9ca3af';
                }
              }}
            >
              {projectsLoading ? (
                <>
                  <div style={{
                    width: 12,
                    height: 12,
                    border: '2px solid #374151',
                    borderTop: '2px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Loading...
                </>
              ) : (
                <>
                  🔄 Refresh
                </>
              )}
            </button>
          </div>
          <div style={{ position: 'relative' }} data-dropdown>
            {/* Custom Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                width: '100%',
                padding: '14px 20px',
                paddingRight: '48px',
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                color: '#fff',
                border: '2px solid #374151',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 500,
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                letterSpacing: '0.025em',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                if (!isDropdownOpen) {
                  e.currentTarget.style.borderColor = '#4b5563';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDropdownOpen) {
                  e.currentTarget.style.borderColor = '#374151';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }
              }}
            >
              <span style={{ 
                color: selectedProject ? '#fff' : '#9ca3af',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}>
                {selectedProject 
                  ? `${selectedProject.name} ${selectedProject.characters.length > 0 ? `(${selectedProject.characters.map(c => c.name).join(', ')})` : ''}`
                  : 'Choose a project (optional)...'
                }
              </span>
              <div style={{
                color: '#9ca3af',
                fontSize: '16px',
                transition: 'transform 0.2s ease',
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                marginLeft: '12px'
              }}>
                ▼
              </div>
            </button>

            {/* Custom Dropdown Menu */}
            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                border: '2px solid #374151',
                borderRadius: 12,
                marginTop: 4,
                boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 50,
                maxHeight: '300px',
                overflowY: 'auto',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                {projectsLoading ? (
                  <div style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    color: '#9ca3af'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      border: '2px solid #374151',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }} />
                    Loading projects...
                  </div>
                ) : projects.length === 0 ? (
                  <div style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    color: '#9ca3af'
                  }}>
                    No projects found
                  </div>
                ) : (
                  <>
                    {/* Clear Selection Option */}
                    <button
                      type="button"
                      onClick={() => handleProjectSelect(null)}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        background: 'transparent',
                        color: '#9ca3af',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid #374151',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#374151';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#9ca3af';
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>🗑️</span>
                      Clear selection
                    </button>
                    
                    {/* Project Options */}
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleProjectSelect(project)}
                        style={{
                          width: '100%',
                          padding: '12px 20px',
                          background: selectedProject?.id === project.id ? '#3b82f6' : 'transparent',
                          color: selectedProject?.id === project.id ? '#fff' : '#d1d5db',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #374151',
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedProject?.id !== project.id) {
                            e.currentTarget.style.background = '#374151';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedProject?.id !== project.id) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#d1d5db';
                          }
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: '600',
                            marginBottom: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {project.name}
                          </div>
                          {project.characters.length > 0 && (
                            <div style={{
                              fontSize: '12px',
                              color: selectedProject?.id === project.id ? '#e5e7eb' : '#9ca3af',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {project.characters.map(c => c.name).join(', ')}
                            </div>
                          )}
                        </div>
                        {selectedProject?.id === project.id && (
                          <div style={{
                            color: '#fff',
                            fontSize: '16px',
                            marginLeft: '8px'
                          }}>
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
            {selectedProject && (
              <div style={{
                marginTop: 16,
                padding: 16,
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                borderRadius: 12,
                border: '2px solid #374151',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 12
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10b981',
                    marginRight: 8,
                    animation: 'pulse 2s infinite'
                  }} />
                  <p style={{
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    margin: 0
                  }}>
                    {selectedProject.name}
                  </p>
                </div>
                {selectedProject.visualStyle && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <span style={{
                      color: '#9ca3af',
                      fontSize: 12,
                      fontWeight: 500,
                      marginRight: 8,
                      minWidth: '50px'
                    }}>
                      Style:
                    </span>
                    <span style={{
                      background: '#374151',
                      color: '#d1d5db',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {selectedProject.visualStyle}
                    </span>
                  </div>
                )}
                {selectedProject.characters.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: 8
                  }}>
                    <span style={{
                      color: '#9ca3af',
                      fontSize: 12,
                      fontWeight: 500,
                      marginRight: 8,
                      minWidth: '80px',
                      marginTop: 2
                    }}>
                      Characters:
                    </span>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6
                    }}>
                      {selectedProject.characters.map((character, index) => (
                        <span
                          key={index}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: '#fff',
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: '0.025em'
                          }}
                        >
                          {character.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProject.description && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: '#111827',
                    borderRadius: 8,
                    border: '1px solid #374151'
                  }}>
                    <p style={{
                      color: '#9ca3af',
                      fontSize: 12,
                      fontWeight: 500,
                      margin: 0,
                      marginBottom: 6
                    }}>
                      Project Description:
                    </p>
                    <p style={{
                      color: '#d1d5db',
                      fontSize: 13,
                      lineHeight: 1.5,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {selectedProject.description}
                    </p>
                  </div>
                )}
                {selectedProject.context && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: '#111827',
                    borderRadius: 8,
                    border: '1px solid #374151',
                    minHeight: 100
                  }}>
                    <p style={{
                      color: '#9ca3af',
                      fontSize: 12,
                      fontWeight: 500,
                      margin: 0,
                      marginBottom: 6
                    }}>
                      Project Context:
                    </p>
                    <p style={{
                      color: '#d1d5db',
                      fontSize: 13,
                      lineHeight: 1.5,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {selectedProject.context}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <label 
              htmlFor="description" 
              style={{ 
                display: 'block', 
                color: '#fff', 
                fontSize: 14, 
                fontWeight: 500, 
                marginBottom: 8 
              }}
            >
              Video Description
            </label>
            <textarea
              id="description"
              value={state.description}
              onChange={(e) => setState(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the video you want to create..."
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#2d3748',
                color: '#fff',
                border: '1px solid #4a5568',
                borderRadius: 8,
                fontSize: 14,
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s',
                opacity: state.isLoading ? 0.6 : 1,
                cursor: state.isLoading ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#4a5568'}
              rows={12}
              disabled={state.isLoading}
            />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <button
              type="submit"
              disabled={state.isLoading || !state.description.trim()}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: state.isLoading || !state.description.trim() ? '#4a5568' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: state.isLoading || !state.description.trim() ? 'not-allowed' : 'pointer',
                opacity: state.isLoading || !state.description.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!state.isLoading && state.description.trim()) {
                  e.currentTarget.style.background = '#1d4ed8';
                }
              }}
              onMouseLeave={(e) => {
                if (!state.isLoading && state.description.trim()) {
                  e.currentTarget.style.background = '#2563eb';
                }
              }}
            >
              {state.isLoading ? (
                <>
                  <div style={{
                    width: 16,
                    height: 16,
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                      Generating Video {timeRemaining ? `(${timeRemaining}s)` : '(120s)'}...
                </>
              ) : (
                'Generate Video'
              )}
            </button>

            {(state.videoUrl || state.error) && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#a1a1aa',
                  border: '1px solid #4a5568',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2d3748';
                  e.currentTarget.style.borderColor = '#6b7280';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#4a5568';
                }}
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {state.isLoading && timeRemaining && (
          <div style={{
            padding: 16,
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: 8,
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ 
                color: '#60a5fa', 
                marginRight: 12, 
                fontSize: 16
              }}>
                🎬
              </div>
              <div>
                <h3 style={{ 
                  color: '#fff', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  marginBottom: 4 
                }}>
                  Video Generation in Progress
                </h3>
                    <p style={{
                      color: '#a1a1aa',
                      fontSize: 12,
                      margin: 0
                    }}>
                      Please wait while we generate your video... This usually takes around 90-120 seconds.
                    </p>
              </div>
            </div>
            <div style={{
              width: '100%',
              height: 4,
              background: '#374151',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.max(0, ((120 - (timeRemaining || 120)) / 120) * 100)}%`,
                height: '100%',
                background: '#3b82f6',
                borderRadius: 2,
                transition: 'width 1s linear'
              }} />
            </div>
            <div style={{
              color: '#a1a1aa',
              fontSize: 12,
              textAlign: 'center',
              marginTop: 8
            }}>
              {timeRemaining} seconds remaining
            </div>
          </div>
        )}

        {state.error && (
          <div style={{
            padding: 16,
            background: '#2d1b1b',
            border: '1px solid #7f1d1d',
            borderRadius: 8,
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ 
                color: '#f87171', 
                marginRight: 12, 
                fontSize: 16,
                marginTop: 2
              }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ 
                  color: '#f87171', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  marginBottom: 4 
                }}>
                  Error
                </h3>
                <p style={{ 
                  color: '#fca5a5', 
                  fontSize: 14, 
                  margin: 0 
                }}>
                  {state.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {(state.mergedVideo || state.sceneVideos.length > 0) && (
          <div>
            <h3 style={{ 
              color: '#fff', 
              fontSize: 18, 
              fontWeight: 600, 
              marginBottom: 16 
            }}>
              Generated Videos
            </h3>

            {/* Scene Videos Section */}
            {state.sceneVideos.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ 
                  color: '#fff', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 12 
                }}>
                  Scene Videos ({state.sceneVideos.length})
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 16
                }}>
                  {state.sceneVideos.map((videoUrl, index) => (
                    <div key={index} style={{
                      background: '#2d3748',
                      borderRadius: 8,
                      padding: 16,
                      border: '1px solid #4a5568'
                    }}>
                      <h5 style={{ 
                        color: '#fff', 
                        fontSize: 14, 
                        fontWeight: 600, 
                        marginBottom: 8 
                      }}>
                        Scene {index + 1}
                      </h5>
                      <video
                        controls
                        preload="metadata"
                        style={{
                          width: '100%',
                          borderRadius: 6,
                          background: '#1f2937'
                        }}
                        src={videoUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <a
                          href={videoUrl}
                          download={`scene_${index + 1}.mp4`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: '#374151',
                            color: '#fff',
                            textDecoration: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#374151'}
                        >
                          <span>📥</span>
                          Download Scene {index + 1}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merged Video Section */}
            {state.mergedVideo && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ 
                  color: '#fff', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 12 
                }}>
                  Final Merged Video
                </h4>
                <div style={{
                  background: '#2d3748',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16
                }}>
                  {mergedVideoError && mergedVideoRetryCount >= 3 ? (
                    <div style={{
                      padding: 20,
                      textAlign: 'center',
                      color: '#f87171'
                    }}>
                      <p style={{ marginBottom: 12 }}>
                        Video temporarily unavailable. Please check your video history below.
                      </p>
                      <button
                        onClick={() => {
                          setMergedVideoError(false);
                          setMergedVideoRetryCount(0);
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <>
                      {mergedVideoRetryCount > 0 && mergedVideoRetryCount < 3 && (
                        <div style={{
                          padding: 12,
                          textAlign: 'center',
                          color: '#a1a1aa',
                          fontSize: 12,
                          marginBottom: 8,
                          background: '#1f2937',
                          borderRadius: 6
                        }}>
                          Video is processing... Please wait a moment. (Retry {mergedVideoRetryCount}/3)
                        </div>
                      )}
                      <video
                        controls
                        key={`${state.mergedVideo}-${mergedVideoRetryCount}`}
                        preload="metadata"
                        crossOrigin="anonymous"
                        style={{
                          width: '100%',
                          maxWidth: 600,
                          borderRadius: 8,
                          display: 'block',
                          margin: '0 auto'
                        }}
                        src={state.mergedVideo}
                        onError={(e) => {
                          console.error('Video load error:', e);
                          if (mergedVideoRetryCount < 3) {
                            // Retry after a delay
                            setTimeout(() => {
                              setMergedVideoRetryCount(prev => prev + 1);
                            }, 2000 * (mergedVideoRetryCount + 1)); // Exponential backoff: 2s, 4s, 6s
                          } else {
                            setMergedVideoError(true);
                          }
                        }}
                        onLoadedData={() => {
                          // Successfully loaded, reset error state
                          setMergedVideoError(false);
                          setMergedVideoRetryCount(0);
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </>
                  )}
                </div>
                
                {/* Video Info Display */}
                {state.videoInfo && (
                  <div style={{
                    background: '#1f2937',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 16,
                    border: '1px solid #374151'
                  }}>
                    <h5 style={{ 
                      color: '#fff', 
                      fontSize: 14, 
                      fontWeight: 600, 
                      marginBottom: 8 
                    }}>
                      Video Details
                    </h5>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 12,
                      fontSize: 12,
                      color: '#a1a1aa'
                    }}>
                      <div>
                        <span style={{ color: '#fff', fontWeight: 500 }}>Duration:</span><br />
                        {state.videoInfo.duration}s
                      </div>
                      <div>
                        <span style={{ color: '#fff', fontWeight: 500 }}>Resolution:</span><br />
                        {state.videoInfo.resolution}
                      </div>
                      <div>
                        <span style={{ color: '#fff', fontWeight: 500 }}>Model:</span><br />
                        {state.videoInfo.model}
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ textAlign: 'center' }}>
                  <a
                    href={state.mergedVideo}
                    download="merged_video.mp4"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 20px',
                      background: '#2563eb',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      transition: 'background 0.2s',
                      marginRight: 12
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                  >
                    <span>📥</span>
                    Download Merged Video
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video History Section */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{
            color: '#fff',
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            Your Video History
          </h2>

          {historyLoading ? (
            <div style={{
              padding: 20,
              background: '#1f2937',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div style={{
                color: '#60a5fa',
                fontSize: 16,
                marginBottom: 8
              }}>
                📹
              </div>
              <p style={{
                color: '#a1a1aa',
                fontSize: 14,
                margin: 0
              }}>
                Loading your video history...
              </p>
            </div>
          ) : historyError ? (
            <div style={{
              padding: 16,
              background: '#2d1b1b',
              border: '1px solid #7f1d1d',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <p style={{
                color: '#fca5a5',
                fontSize: 14,
                margin: 0
              }}>
                {historyError}
              </p>
            </div>
          ) : videoHistory.length === 0 ? (
            <div style={{
              padding: 20,
              background: '#1f2937',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div style={{
                color: '#6b7280',
                fontSize: 16,
                marginBottom: 8
              }}>
                🎬
              </div>
              <p style={{
                color: '#a1a1aa',
                fontSize: 14,
                margin: 0
              }}>
                No videos generated yet. Create your first video above!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16
            }}>
              {videoHistory.map((video) => (
                <div
                  key={video.id}
                  style={{
                    background: '#2d3748',
                    borderRadius: 8,
                    padding: 16,
                    border: '1px solid #4a5568'
                  }}
                >
                  {/* Main Video Display - Show merged video if available, otherwise first scene */}
                  <div style={{ marginBottom: 12 }}>
                    <video
                      controls
                      preload="metadata"
                      style={{
                        width: '100%',
                        height: 150,
                        borderRadius: 6,
                        background: '#1f2937'
                      }}
                      src={video.merged_video || video.video_url || ''}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <p style={{
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 500,
                      marginBottom: 4,
                      lineHeight: 1.4
                    }}>
                      {video.description.length > 80 
                        ? `${video.description.substring(0, 80)}...` 
                        : video.description
                      }
                    </p>
                  </div>

                  {/* Scenes counter (non-clickable) */}
                  {video.total_scenes && video.total_scenes > 0 && (
                    <p style={{
                      color: '#a1a1aa',
                      fontSize: 12,
                      marginBottom: 8
                    }}>
                      {video.total_scenes} {video.total_scenes === 1 ? 'scene' : 'scenes'}
                    </p>
                  )}

                  {video.video_info && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                      color: '#a1a1aa',
                      marginBottom: 12
                    }}>
                      <span>{video.video_info.duration}s</span>
                      <span>{video.video_info.resolution}</span>
                      <span>{new Date(video.created_at).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div style={{ 
                    display: 'flex', 
                    gap: 8, 
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    {/* Download Merged Video */}
                    {(video.merged_video || video.video_url) && (
                      <a
                        href={video.merged_video || video.video_url || '#'}
                        download="merged_video.mp4"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          background: '#374151',
                          color: '#fff',
                          textDecoration: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          transition: 'background 0.2s',
                          flex: 1,
                          justifyContent: 'center',
                          minWidth: '120px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#374151'}
                      >
                        <span>📥</span>
                        Download
                      </a>
                    )}

                    {/* YouTube Link */}
                    {video.youtube_video && (
                      <a
                        href={video.youtube_video}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          background: '#374151',
                          color: '#fff',
                          textDecoration: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          transition: 'background 0.2s',
                          flex: 1,
                          justifyContent: 'center',
                          minWidth: '120px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#374151'}
                      >
                        <span>▶️</span>
                        YouTube
                      </a>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteVideo(video.id, video.description)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                        color: '#fff',
                        border: '1px solid #7f1d1d',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flex: 1,
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(127, 29, 29, 0.3)',
                        minWidth: '120px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(127, 29, 29, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(127, 29, 29, 0.3)';
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '90%',
            border: '2px solid #374151',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <div style={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                fontSize: 20,
                boxShadow: '0 4px 8px rgba(127, 29, 29, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}>
                🗑️
              </div>
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 4,
                  letterSpacing: '0.025em'
                }}>
                  Delete Video
                </h3>
                <p style={{
                  color: '#9ca3af',
                  fontSize: 14,
                  margin: 0,
                  fontWeight: 500
                }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div style={{
              background: '#111827',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
              border: '1px solid #374151'
            }}>
              <p style={{
                color: '#d1d5db',
                fontSize: 14,
                margin: 0,
                lineHeight: 1.5
              }}>
                Are you sure you want to delete this video?
              </p>
              <p style={{
                color: '#9ca3af',
                fontSize: 13,
                margin: '8px 0 0 0',
                fontStyle: 'italic'
              }}>
                "{deleteConfirm.videoDescription}"
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center'
            }}>
              <button
                onClick={cancelDeleteVideo}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#9ca3af',
                  border: '2px solid #374151',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  minWidth: '120px',
                  whiteSpace: 'nowrap',
                  opacity: isDeleting ? 0.6 : 1,
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
                disabled={isDeleting}
                onMouseEnter={(e) => {
                  if (isDeleting) return;
                  e.currentTarget.style.background = '#374151';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  if (isDeleting) return;
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.borderColor = '#374151';
                }}
              >
                No
              </button>
              <button
                onClick={confirmDeleteVideo}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                  color: '#fff',
                  border: '2px solid #7f1d1d',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  minWidth: '120px',
                  boxShadow: '0 4px 8px rgba(127, 29, 29, 0.4)',
                  letterSpacing: '0.025em',
                  whiteSpace: 'nowrap',
                  opacity: isDeleting ? 0.8 : 1,
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
                disabled={isDeleting}
                onMouseEnter={(e) => {
                  if (isDeleting) return;
                  e.currentTarget.style.background = 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(127, 29, 29, 0.5)';
                }}
                onMouseLeave={(e) => {
                  if (isDeleting) return;
                  e.currentTarget.style.background = 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(127, 29, 29, 0.4)';
                }}
              >
                {isDeleting ? (
                  <>
                    <div style={{
                      width: 16,
                      height: 16,
                      border: '2px solid #fff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: 8
                    }} />
                    Deleting...
                  </>
                ) : (
                  'Yes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
