import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Plus, Users, Clock, CheckCircle, XCircle, Download, Upload, Trash2 } from 'lucide-react'; import { announcementsAPI, committeesAPI, volunteersAPI, attendanceDetailAPI } from '../services/api';


const AdminDashboard = () => {
  const [committees, setCommittees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showCreateCommittee, setShowCreateCommittee] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [committeeName, setCommitteeName] = useState('');
  const [committeeDescription, setCommitteeDescription] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('medium');
  const [announcementCommittee, setAnnouncementCommittee] = useState('');
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [selectedCommitteeForUpload, setSelectedCommitteeForUpload] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [allGeneralAnnouncements, setAllGeneralAnnouncements] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  const loadData = async () => {
    try {
      setLoading(true);
      const [announcementsData, committeesData] = await Promise.all([
        announcementsAPI.getAll({ active_only: true, limit: 10 }),
        committeesAPI.getAll({ limit: 20 })
      ]);

      // Transform committee data to include real-time attendance stats
      const transformedCommittees = await Promise.all(
        (committeesData.data || committeesData || []).map(async (committee) => {
          try {
            // Get actual assignments count for this committee
            const assignmentsData = await volunteersAPI.getAssignments({
              committee_id: committee.id,
              limit: 500
            });
            const totalVolunteers = assignmentsData.length;

            // Get active attendance for this committee
            const activeAttendance = await attendanceDetailAPI.getActiveInCommittee({
              committee_id: committee.id,
              limit: 500
            });
            const present = activeAttendance.length;
            const absent = totalVolunteers - present;

            return {
              ...committee,
              totalVolunteers,
              present,
              absent
            };
          } catch (error) {
            console.error(`Error fetching stats for committee ${committee.id}:`, error);
            return {
              ...committee,
              totalVolunteers: committee.volunteer_count || 0,
              present: 0,
              absent: committee.volunteer_count || 0
            };
          }
        })
      );

      setCommittees(transformedCommittees);
      sessionStorage.setItem('committees', JSON.stringify(transformedCommittees));
      setAnnouncements(announcementsData.data || announcementsData || []);
      setError('');

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommittee = async () => {
    if (committeeName.trim()) {
      try {
        const newCommittee = await committeesAPI.create({
          event_id: 1, // You may want to get this from context or props
          name: committeeName,
          description: committeeDescription || ''
        });

        // Transform the new committee to match our structure
        const transformedCommittee = {
          ...newCommittee,
          totalVolunteers: 0,
          present: 0,
          absent: 0
        };

        const updatedCommittees = [...committees, transformedCommittee];
        setCommittees(updatedCommittees);

        // Update sessionStorage
        sessionStorage.setItem('committees', JSON.stringify(updatedCommittees));

        setCommitteeName('');
        setCommitteeDescription('');
        setShowCreateCommittee(false);
      } catch (err) {
        console.error('Error creating committee:', err);
        setError('Failed to create committee');
      }
    }
  };

  const handleCreateAnnouncement = async () => {
    if (announcementTitle.trim() && announcementContent.trim()) {
      try {
        const announcementData = {
          event_id: 1, // You may want to get this from context or props
          title: announcementTitle,
          body: announcementContent,
          priority: announcementPriority,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        };

        // Add committee_id if a specific committee is selected
        if (announcementCommittee) {
          announcementData.committee_id = parseInt(announcementCommittee);
        }

        const newAnnouncement = await announcementsAPI.create(announcementData);

        setAnnouncements([newAnnouncement, ...announcements]);
        setAnnouncementTitle('');
        setAnnouncementContent('');
        setAnnouncementPriority('medium');
        setAnnouncementCommittee('');
        setShowCreateAnnouncement(false);
      } catch (err) {
        console.error('Error creating announcement:', err);
        setError('Failed to create announcement');
      }
    }
  };

const handleBulkUpload = async () => {
  if (!bulkUploadFile || !selectedCommitteeForUpload) {
    setError('Please select both a file and a committee for bulk upload');
    return;
  }

  try {
    setUploadLoading(true);
    setError('');

    // Use the bulkUpload API function (same as VolunteerManagement)
    const result = await volunteersAPI.bulkUpload(bulkUploadFile, 1, parseInt(selectedCommitteeForUpload));

    // Show success message
    alert(`Upload successful! Created ${result.created_volunteers} volunteers and ${result.created_assignments} assignments. Updated ${result.updated_assignments} assignments.`);
    
    if (result.errors && result.errors.length > 0) {
      console.warn('Upload errors:', result.errors);
      setError(`Upload completed with some errors. Check console for details.`);
    }

    // Reset form
    setBulkUploadFile(null);
    setSelectedCommitteeForUpload('');
    setShowBulkUpload(false);

    // Refresh data
    loadData();

  } catch (error) {
    console.error('Error uploading CSV:', error);
    setError('Failed to upload CSV: ' + error.message);
  } finally {
    setUploadLoading(false);
  }
};

  const handleExportVolunteers = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/volunteers/export_csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all-volunteers-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to export volunteers');
      }

    } catch (error) {
      console.error('Error exporting volunteers:', error);
      setError('Failed to export volunteers');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAssignments = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/volunteers/assignments/export_csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all-assignments-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to export assignments');
      }

    } catch (error) {
      console.error('Error exporting assignments:', error);
      setError('Failed to export assignments');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      await announcementsAPI.delete(announcementId);

      // Remove from local state
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== announcementId));
      setAllGeneralAnnouncements(prev => prev.filter(announcement => announcement.id !== announcementId));

      alert('Announcement deleted successfully');

    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError('Failed to delete announcement: ' + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommittee = async (committeeId) => {
    if (!window.confirm('Are you sure you want to delete this committee? This will also remove all associated assignments. This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      await committeesAPI.delete(committeeId);

      // Remove from local state
      const updatedCommittees = committees.filter(committee => committee.id !== committeeId);
      setCommittees(updatedCommittees);

      // Update sessionStorage
      sessionStorage.setItem('committees', JSON.stringify(updatedCommittees));

      alert('Committee deleted successfully');

    } catch (error) {
      console.error('Error deleting committee:', error);
      setError('Failed to delete committee: ' + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCommitteeClick = (committee) => {
    // Store the specific committee data for the detail page
    sessionStorage.setItem('currentCommittee', JSON.stringify(committee));
    navigate(`/admin/committee/${committee.id}`);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsMenu && !event.target.closest('.options-menu')) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showOptionsMenu]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button
            onClick={() => setError('')}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Create Committee Modal */}
      {showCreateCommittee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Committee</h3>
            <input
              type="text"
              placeholder="Committee Name"
              value={committeeName}
              onChange={(e) => setCommitteeName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              placeholder="Committee Description (Optional)"
              value={committeeDescription}
              onChange={(e) => setCommitteeDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateCommittee}
                disabled={!committeeName.trim() || loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateCommittee(false);
                  setCommitteeName('');
                  setCommitteeDescription('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Announcement</h3>
            <input
              type="text"
              placeholder="Announcement Title"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              placeholder="Announcement Content"
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={announcementPriority}
              onChange={(e) => setAnnouncementPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              value={announcementCommittee}
              onChange={(e) => setAnnouncementCommittee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Committees</option>
              {committees.map(committee => (
                <option key={committee.id} value={committee.id}>
                  {committee.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleCreateAnnouncement}
                disabled={!announcementTitle.trim() || !announcementContent.trim() || loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateAnnouncement(false);
                  setAnnouncementTitle('');
                  setAnnouncementContent('');
                  setAnnouncementPriority('medium');
                  setAnnouncementCommittee('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Bulk Upload Volunteers</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Committee *
                </label>
                <select
                  value={selectedCommitteeForUpload}
                  onChange={(e) => setSelectedCommitteeForUpload(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a committee...</option>
                  {committees.map(committee => (
                    <option key={committee.id} value={committee.id}>
                      {committee.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File *
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload CSV</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {bulkUploadFile ? bulkUploadFile.name : 'CSV files only'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={(e) => setBulkUploadFile(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleBulkUpload}
                disabled={!bulkUploadFile || !selectedCommitteeForUpload || uploadLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadLoading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={() => {
                  setShowBulkUpload(false);
                  setBulkUploadFile(null);
                  setSelectedCommitteeForUpload('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View All Announcements Modal */}
      {showAllAnnouncements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">All Announcements</h3>
              <button
                onClick={() => setShowAllAnnouncements(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1">
              {allGeneralAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
                  onClick={() => {
                    setSelectedAnnouncement(announcement);
                    setShowAllAnnouncements(false);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800">{announcement.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ml-2 ${announcement.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                      announcement.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                        announcement.priority === 'medium' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                      }`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{announcement.body}</p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>By: {announcement.created_by_name || 'Admin'}</span>
                    <div className="flex items-center gap-2">
                      <span>{formatDate(announcement.created_at)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnnouncement(announcement.id);
                        }}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        title="Delete announcement"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Announcement Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-semibold text-gray-800">{selectedAnnouncement.title}</h3>
                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${selectedAnnouncement.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                  selectedAnnouncement.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                    selectedAnnouncement.priority === 'medium' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                  }`}>
                  {selectedAnnouncement.priority}
                </span>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1">
              <div>
                <p className="text-gray-700 whitespace-pre-wrap break-words">{selectedAnnouncement.body}</p>
              </div>

              <div className="border-t pt-4 text-sm text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Created by:</span>
                  <span>{selectedAnnouncement.created_by_name || 'Admin'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{formatDate(selectedAnnouncement.created_at)}</span>
                </div>
                {selectedAnnouncement.expires_at && (
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span>{formatDate(selectedAnnouncement.expires_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Announcements Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Announcements</h2>
          <div className="flex gap-2">
            {announcements.length > 2 && (
              <button
                onClick={() => {
                  setAllGeneralAnnouncements(announcements);
                  setShowAllAnnouncements(true);
                }}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-200"
              >
                View All
              </button>
            )}
            <button
              onClick={() => setShowCreateAnnouncement(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} />
              New
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No announcements yet</p>
          ) : (
            announcements.slice(0, 2).map((announcement) => (
              <div
                key={announcement.id}
                className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
                onClick={() => setSelectedAnnouncement(announcement)}
              >                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800">{announcement.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ml-2 ${announcement.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                    announcement.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                      announcement.priority === 'medium' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                    {announcement.priority}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{announcement.body}</p>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>By: {announcement.created_by_name || 'Admin'}</span>
                  <span>{formatDate(announcement.created_at)}</span>
                </div>
                {announcement.committee_name && (
                  <p className="text-xs text-blue-600 mt-1">Committee: {announcement.committee_name}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Committees Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Committees</h2>
          <div className="relative options-menu">
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Actions
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setShowCreateCommittee(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                >
                  <Plus size={16} />
                  Create Committee
                </button>
                <button
                  onClick={() => {
                    setShowCreateAnnouncement(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create Announcement
                </button>
                <button
                  onClick={() => {
                    setShowBulkUpload(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Upload size={16} />
                  Bulk Upload Volunteers
                </button>
                <div className="border-t border-gray-200"></div>
                <button
                  onClick={() => {
                    handleExportVolunteers();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                  disabled={loading}
                >
                  <Download size={16} />
                  Export All Volunteers
                </button>
                <button
                  onClick={() => {
                    handleExportAssignments();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 rounded-b-lg"
                  disabled={loading}
                >
                  <Download size={16} />
                  Export All Assignments
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {committees.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No committees yet</p>
              <button
                onClick={() => setShowCreateCommittee(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Create First Committee
              </button>
            </div>
          ) : (
            committees.map((committee) => (
              <div
                key={committee.id}
                onClick={() => handleCommitteeClick(committee)}
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800">{committee.name}</h3>
                </div>

                {committee.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{committee.description}</p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-blue-600">
                      <Users size={16} />
                      <span>Total: {committee.totalVolunteers || 0}</span>
                    </div>

                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle size={16} />
                      <span>Present: {committee.present || 0}</span>
                    </div>

                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle size={16} />
                      <span>Absent: {committee.absent || 0}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCommittee(committee.id);
                    }}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1"
                    title="Delete committee"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;