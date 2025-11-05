'use client';

import { useState, useEffect } from 'react';
import { Project, CharacterData } from '../../../types';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave } from 'react-icons/fi';
import { projectsApi } from '../../../utils/apiClient';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    visualStyle: '',
    description: '',
    context: ''
  });
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  // Load projects from API on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsApi.getProjects();
      if (response.success) {
        setProjects(response.data);
      } else {
        setError(response.error || 'Failed to load projects');
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };


  const resetForm = () => {
    setFormData({
      name: '',
      visualStyle: '',
      description: '',
      context: ''
    });
    setCharacters([]);
    setIsCreating(false);
    setEditingProject(null);
  };

  const addCharacter = () => {
    setCharacters([...characters, { name: '', description: '', context: '' }]);
  };

  const removeCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  const updateCharacter = (index: number, field: keyof CharacterData, value: string) => {
    const updatedCharacters = [...characters];
    updatedCharacters[index] = { ...updatedCharacters[index], [field]: value };
    setCharacters(updatedCharacters);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Project name is required');
      return;
    }

    try {
      if (editingProject) {
        // Update existing project
        const response = await projectsApi.updateProject(editingProject.id, {
          name: formData.name.trim(),
          visualStyle: formData.visualStyle.trim(),
          characters: characters,
          description: formData.description.trim(),
          context: formData.context.trim()
        });

        if (response.success) {
          setProjects(prev => 
            prev.map(project => 
              project.id === editingProject.id ? response.data : project
            )
          );
          resetForm();
        } else {
          alert(response.error || 'Failed to update project');
        }
      } else {
        // Create new project
        const response = await projectsApi.createProject({
          name: formData.name.trim(),
          visualStyle: formData.visualStyle.trim(),
          characters: characters,
          description: formData.description.trim(),
          context: formData.context.trim()
        });

        if (response.success) {
          setProjects(prev => [response.data, ...prev]);
          resetForm();
        } else {
          alert(response.error || 'Failed to create project');
        }
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert('Failed to save project');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setCharacters(project.characters);
    setFormData({
      name: project.name,
      visualStyle: project.visualStyle,
      description: project.description,
      context: project.context
    });
    setIsCreating(true);
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        setDeletingProjectId(projectId);
        const response = await projectsApi.deleteProject(projectId);
        if (response.success) {
          setProjects(prev => prev.filter(project => project.id !== projectId));
        } else {
          alert(response.error || 'Failed to delete project');
        }
      } catch (error: any) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      } finally {
        setDeletingProjectId(null);
      }
    }
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 32 
        }}>
          <h1 style={{ 
            color: '#fff', 
            fontSize: 28, 
            fontWeight: 700, 
            margin: 0 
          }}>
            Projects
          </h1>
          <button
            onClick={() => setIsCreating(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
          >
            <FiPlus size={16} />
            New Project
          </button>
        </div>

        {/* Project Creation/Edit Form */}
        {isCreating && (
          <div style={{
            background: '#2d3748',
            padding: 24,
            borderRadius: 8,
            marginBottom: 32,
            border: '1px solid #4a5568'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <h2 style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: 600,
                margin: 0
              }}>
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button
                onClick={resetForm}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 4
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 8
                  }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#1f2937',
                      color: '#fff',
                      border: '1px solid #4a5568',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#4a5568'}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 8
                  }}>
                    Visual Style
                  </label>
                  <input
                    type="text"
                    name="visualStyle"
                    value={formData.visualStyle}
                    onChange={handleInputChange}
                    placeholder="e.g., Cinematic, Cartoon, Minimalist"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#1f2937',
                      color: '#fff',
                      border: '1px solid #4a5568',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#4a5568'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12
                }}>
                  <label style={{
                    display: 'block',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    margin: 0
                  }}>
                    Characters
                  </label>
                  <button
                    type="button"
                    onClick={addCharacter}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                  >
                    <FiPlus size={12} />
                    Add Character
                  </button>
                </div>

                {characters.length === 0 ? (
                  <div style={{
                    padding: 16,
                    background: '#1f2937',
                    borderRadius: 8,
                    border: '1px solid #374151',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      color: '#9ca3af',
                      fontSize: 13,
                      margin: 0
                    }}>
                      No characters added yet. Click "Add Character" to create one.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {characters.map((character, index) => (
                      <div
                        key={index}
                        style={{
                          background: '#1f2937',
                          borderRadius: 8,
                          padding: 16,
                          border: '1px solid #374151',
                          position: 'relative'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12
                        }}>
                          <h4 style={{
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 600,
                            margin: 0
                          }}>
                            Character #{index + 1}
                          </h4>
                          {characters.length > 0 && (
                            <button
                              type="button"
                              onClick={() => removeCharacter(index)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 4,
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <label style={{
                            display: 'block',
                            color: '#d1d5db',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 6
                          }}>
                            Name *
                          </label>
                          <input
                            type="text"
                            value={character.name}
                            onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                            placeholder="Character name"
                            required
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: '#111827',
                              color: '#fff',
                              border: '1px solid #4a5568',
                              borderRadius: 6,
                              fontSize: 13,
                              outline: 'none',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.target.style.borderColor = '#4a5568'}
                          />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <label style={{
                            display: 'block',
                            color: '#d1d5db',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 6
                          }}>
                            Description
                          </label>
                          <textarea
                            value={character.description || ''}
                            onChange={(e) => updateCharacter(index, 'description', e.target.value)}
                            placeholder="Character description..."
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: '#111827',
                              color: '#fff',
                              border: '1px solid #4a5568',
                              borderRadius: 6,
                              fontSize: 13,
                              outline: 'none',
                              resize: 'none',
                              transition: 'border-color 0.2s',
                              fontFamily: 'inherit'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.target.style.borderColor = '#4a5568'}
                          />
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            color: '#d1d5db',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 6
                          }}>
                            Context
                          </label>
                          <textarea
                            value={character.context || ''}
                            onChange={(e) => updateCharacter(index, 'context', e.target.value)}
                            placeholder="Character background/context..."
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: '#111827',
                              color: '#fff',
                              border: '1px solid #4a5568',
                              borderRadius: 6,
                              fontSize: 13,
                              outline: 'none',
                              resize: 'none',
                              transition: 'border-color 0.2s',
                              fontFamily: 'inherit'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.target.style.borderColor = '#4a5568'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8
                }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your project..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1f2937',
                    color: '#fff',
                    border: '1px solid #4a5568',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#4a5568'}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 8
                }}>
                  Context
                </label>
                <textarea
                  name="context"
                  value={formData.context}
                  onChange={handleInputChange}
                  placeholder="Background information or creative direction..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1f2937',
                    color: '#fff',
                    border: '1px solid #4a5568',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#4a5568'}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                >
                  <FiSave size={16} />
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '12px 20px',
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
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            padding: 40,
            background: '#1f2937',
            borderRadius: 8,
            textAlign: 'center',
            border: '1px solid #374151'
          }}>
            <div style={{
              color: '#60a5fa',
              fontSize: 48,
              marginBottom: 16
            }}>
              ⏳
            </div>
            <h3 style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 8
            }}>
              Loading Projects...
            </h3>
            <p style={{
              color: '#a1a1aa',
              fontSize: 14,
              margin: 0
            }}>
              Please wait while we fetch your projects
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            padding: 40,
            background: '#2d1b1b',
            borderRadius: 8,
            textAlign: 'center',
            border: '1px solid #7f1d1d',
            marginBottom: 24
          }}>
            <div style={{
              color: '#f87171',
              fontSize: 48,
              marginBottom: 16
            }}>
              ⚠️
            </div>
            <h3 style={{
              color: '#f87171',
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 8
            }}>
              Error Loading Projects
            </h3>
            <p style={{
              color: '#fca5a5',
              fontSize: 14,
              marginBottom: 16
            }}>
              {error}
            </p>
            <button
              onClick={loadProjects}
              style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && projects.length === 0 ? (
          <div style={{
            padding: 40,
            background: '#1f2937',
            borderRadius: 8,
            textAlign: 'center',
            border: '1px solid #374151'
          }}>
            <div style={{
              color: '#6b7280',
              fontSize: 48,
              marginBottom: 16
            }}>
              📁
            </div>
            <h3 style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 8
            }}>
              No Projects Yet
            </h3>
            <p style={{
              color: '#a1a1aa',
              fontSize: 14,
              marginBottom: 20
            }}>
              Create your first project to get started
            </p>
            <button
              onClick={() => setIsCreating(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                margin: '0 auto',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
            >
              <FiPlus size={16} />
              Create Project
            </button>
          </div>
        ) : !loading && !error && projects.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 20
          }}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  background: '#2d3748',
                  borderRadius: 8,
                  padding: 20,
                  border: '1px solid #4a5568',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => handleEdit(project)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEdit(project); } }}
                tabIndex={0}
                role="button"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16
                }}>
                  <h3 style={{
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 600,
                    margin: 0,
                    flex: 1
                  }}>
                    {project.name}
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(project); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 4,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#1e40af'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                      disabled={deletingProjectId === project.id}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: deletingProjectId === project.id ? '#9ca3af' : '#f87171',
                        cursor: deletingProjectId === project.id ? 'not-allowed' : 'pointer',
                        padding: 6,
                        borderRadius: 4,
                        transition: 'background 0.2s',
                        opacity: deletingProjectId === project.id ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (deletingProjectId !== project.id) {
                          e.currentTarget.style.background = '#dc2626';
                        }
                      }}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {deletingProjectId === project.id ? (
                        <div style={{
                          width: 16,
                          height: 16,
                          border: '2px solid #9ca3af',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                      ) : (
                        <FiTrash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {project.visualStyle && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#374151',
                      color: '#d1d5db',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {project.visualStyle}
                    </span>
                  </div>
                )}

                {project.characters.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{
                      color: '#a1a1aa',
                      fontSize: 12,
                      fontWeight: 500,
                      marginBottom: 6
                    }}>
                      Characters ({project.characters.length}):
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {project.characters.slice(0, 2).map((character, index) => (
                        <div
                          key={index}
                          style={{
                            background: '#1f2937',
                            borderRadius: 6,
                            padding: 8,
                            border: '1px solid #374151'
                          }}
                        >
                          <p style={{
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                            margin: 0,
                            marginBottom: 4
                          }}>
                            {character.name || 'Unnamed Character'}
                          </p>
                          {character.description && (
                            <p style={{
                              color: '#9ca3af',
                              fontSize: 11,
                              lineHeight: 1.3,
                              margin: 0,
                              marginBottom: character.context ? 4 : 0
                            }}>
                              {character.description.length > 60 
                                ? `${character.description.substring(0, 60)}...` 
                                : character.description
                              }
                            </p>
                          )}
                          {character.context && (
                            <p style={{
                              color: '#6b7280',
                              fontSize: 10,
                              lineHeight: 1.3,
                              margin: 0
                            }}>
                              {character.context.length > 50 
                                ? `${character.context.substring(0, 50)}...` 
                                : character.context
                              }
                            </p>
                          )}
                        </div>
                      ))}
                      {project.characters.length > 2 && (
                        <p style={{
                          color: '#9ca3af',
                          fontSize: 11,
                          margin: 0,
                          textAlign: 'center'
                        }}>
                          +{project.characters.length - 2} more character(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {project.description && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{
                      color: '#a1a1aa',
                      fontSize: 12,
                      fontWeight: 500,
                      marginBottom: 4
                    }}>
                      Description:
                    </p>
                    <p style={{
                      color: '#d1d5db',
                      fontSize: 13,
                      lineHeight: 1.4,
                      margin: 0
                    }}>
                      {project.description.length > 100 
                        ? `${project.description.substring(0, 100)}...` 
                        : project.description
                      }
                    </p>
                  </div>
                )}

                {project.context && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{
                      color: '#a1a1aa',
                      fontSize: 12,
                      fontWeight: 500,
                      marginBottom: 4
                    }}>
                      Context:
                    </p>
                    <p style={{
                      color: '#d1d5db',
                      fontSize: 13,
                      lineHeight: 1.4,
                      margin: 0
                    }}>
                      {project.context.length > 80 
                        ? `${project.context.substring(0, 80)}...` 
                        : project.context
                      }
                    </p>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTop: '1px solid #4a5568',
                  fontSize: 11,
                  color: '#6b7280'
                }}>
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
