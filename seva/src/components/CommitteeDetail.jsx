import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Play, Square, Download, Search, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { committeesAPI, announcementsAPI, volunteersAPI, attendanceDetailAPI } from '../services/api';

const CommitteeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [committee, setCommittee] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeShift, setActiveShift] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttendance, setShowAttendance] = useState(false);
  const [activeTab, setActiveTab] = useState('announcements');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState('');
  const [availableShifts, setAvailableShifts] = useState([]);
  const [shiftGroups, setShiftGroups] = useState({});
  const [selectedGroup, setSelectedGroup] = useState('');
  const [clickingVolunteer, setClickingVolunteer] = useState(null);


  // Load active shift and selected shift from localStorage on component mount
  useEffect(() => {
    const savedActiveShift = localStorage.getItem(`activeShift_${id}`);
    const savedSelectedShift = localStorage.getItem(`selectedShift_${id}`);
    const savedDropdownShift = localStorage.getItem(`dropdownShift_${id}`);

    if (savedActiveShift === 'true' && savedSelectedShift) {
      setActiveShift(true);
      setSelectedShift(savedSelectedShift);
      setShowAttendance(true);
    }

    // Restore dropdown selection
    if (savedDropdownShift) {
      setSelectedShift(savedDropdownShift);
    }
  }, [id]);

  useEffect(() => {
    fetchCommitteeData();
    fetchAnnouncements();
    fetchShiftsAndGroups();
    if (activeTab === 'attendance') {
      fetchAttendanceData();
    }
  }, [id, activeTab, selectedDate, selectedShift]);

  // Save active shift state and dropdown selection to localStorage whenever they change
  useEffect(() => {
    if (activeShift && selectedShift) {
      localStorage.setItem(`activeShift_${id}`, 'true');
      localStorage.setItem(`selectedShift_${id}`, selectedShift);
    } else {
      localStorage.removeItem(`activeShift_${id}`);
      localStorage.removeItem(`selectedShift_${id}`);
    }
  }, [activeShift, selectedShift, id]);

  // Save dropdown selection separately
  useEffect(() => {
    if (selectedShift) {
      localStorage.setItem(`dropdownShift_${id}`, selectedShift);
    } else {
      localStorage.removeItem(`dropdownShift_${id}`);
    }
  }, [selectedShift, id]);
  // Persist attendance state
  useEffect(() => {
    if (volunteers.length > 0) {
      localStorage.setItem(`attendanceState_${id}_${selectedDate}`, JSON.stringify(volunteers));
    }
  }, [volunteers, id, selectedDate]);

  // Restore attendance state
  useEffect(() => {
    const savedState = localStorage.getItem(`attendanceState_${id}_${selectedDate}`);
    if (savedState && showAttendance) {
      try {
        const parsedState = JSON.parse(savedState);
        // Only restore if we don't have current data
        if (volunteers.length === 0) {
          setVolunteers(parsedState);
        }
      } catch (error) {
        console.error('Error restoring attendance state:', error);
      }
    }
  }, [id, selectedDate, showAttendance]);
  const fetchCommitteeData = async () => {
    try {
      // Always fetch fresh data for real-time stats
      const response = await committeesAPI.getAll();
      const committees = response.data || response || [];
      const foundCommittee = committees.find(c => c.id.toString() === id.toString());

      if (foundCommittee) {
        // Get real-time attendance stats
        try {
          const assignmentsData = await volunteersAPI.getAssignments({
            committee_id: id,
            limit: 500
          });
          const totalVolunteers = assignmentsData.length;

          const activeAttendance = await attendanceDetailAPI.getActiveInCommittee({
            committee_id: id,
            limit: 500
          });
          const present = activeAttendance.length;
          const absent = totalVolunteers - present;

          const transformedCommittee = {
            ...foundCommittee,
            totalVolunteers,
            present,
            absent
          };
          setCommittee(transformedCommittee);
        } catch (statsError) {
          console.error('Error fetching committee stats:', statsError);
          setCommittee({
            ...foundCommittee,
            totalVolunteers: foundCommittee.volunteer_count || 0,
            present: 0,
            absent: foundCommittee.volunteer_count || 0
          });
        }
      } else {
        throw new Error('Committee not found');
      }
    } catch (error) {
      console.error('Error fetching committee data:', error);
      setError('Failed to load committee data');
    }
  };

  const fetchShiftsAndGroups = async () => {
    try {
      const assignmentsData = await volunteersAPI.getAssignments({
        committee_id: id,
        limit: 500
      });

      console.log('Raw assignments data:', assignmentsData); // ADD THIS
      setAssignments(assignmentsData);

      const shifts = [...new Set(assignmentsData
        .map(assignment => assignment.shift)
        .filter(shift => shift && shift.trim() !== ''))];

      console.log('Available shifts:', shifts); // ADD THIS
      setAvailableShifts(shifts);

      const shiftGroupMapping = {};

      assignmentsData.forEach(assignment => {
        console.log('Processing assignment:', assignment.shift, assignment.notes); // ADD THIS
        if (assignment.shift && assignment.notes) {
          if (!shiftGroupMapping[assignment.shift]) {
            shiftGroupMapping[assignment.shift] = new Set();
          }

          const notesParts = assignment.notes.split(',').map(note => note.trim());
          console.log('Notes parts:', notesParts); // ADD THIS
          if (notesParts.length >= 2) {
            const group = notesParts[0];
            const coordinator = notesParts[1];
            const groupData = {
              group: group,
              coordinator: coordinator,
              display: `${group} - ${coordinator}`
            };
            console.log('Adding group data:', groupData); // ADD THIS
            shiftGroupMapping[assignment.shift].add(JSON.stringify(groupData));
          }
        }
      });

      console.log('Final shift groups mapping:', shiftGroupMapping); // ADD THIS

      Object.keys(shiftGroupMapping).forEach(shift => {
        shiftGroupMapping[shift] = Array.from(shiftGroupMapping[shift])
          .map(item => JSON.parse(item));
      });

      setShiftGroups(shiftGroupMapping);
      console.log('Full assignment object:', JSON.stringify(assignmentsData[0], null, 2));

    } catch (error) {
      console.error('Error fetching shifts and groups:', error);
    }
  };
  // NEW CODE - add this missing function:
  const fetchAnnouncements = async () => {
    try {
      // Fetch announcements filtered by committee
      const response = await announcementsAPI.getAll({
        committee_id: id,
        active_only: true,
        limit: 20
      });
      setAnnouncements(response.data || response || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Fetch assignments for the committee
      const assignmentsData = await volunteersAPI.getAssignments({
        committee_id: id,
        limit: 500
      });

      setAssignments(assignmentsData);

      // Transform assignments to volunteers format for attendance tracking
      const volunteersData = assignmentsData.map(assignment => ({
        id: assignment.volunteer_id,
        name: assignment.volunteer_name || `Volunteer ${assignment.volunteer_id}`,
        collegeId: assignment.volunteer_college_id || 'N/A',
        email: assignment.volunteer_email || `volunteer${assignment.volunteer_id}@example.com`,
        assignmentId: assignment.id,
        shift: assignment.shift,
        status: assignment.status || 'assigned'
      }));

      setVolunteers(volunteersData);

      // Fetch active check-ins for the committee
      const activeData = await attendanceDetailAPI.getActiveInCommittee({
        committee_id: id,
        limit: 500
      });

      // Update volunteer status based on active check-ins
      const updatedVolunteers = volunteersData.map(volunteer => {
        const activeRecord = activeData.find(record => record.volunteer_id === volunteer.id);

        // If no shift is active, keep status as 'assigned' (neutral)
        if (!activeShift) {
          return {
            ...volunteer,
            status: 'assigned',
          };
        }

        // If shift is active, update based on attendance records
        return {
          ...volunteer,
          status: activeRecord ? 'present' : 'absent',
          attendanceId: activeRecord?.id
        };
      });

      setVolunteers(updatedVolunteers);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftsWithoutCheckin = async () => {
    try {
      setLoading(true);

      const params = {
        committee_id: id,
        date: selectedDate,
        limit: 500
      };

      if (selectedShift) {
        params.shift = selectedShift;
      }

      const data = await attendanceDetailAPI.getShiftsWithoutCheckin(params);

      // Update volunteers to show who missed check-in
      const missedVolunteers = data.map(shift => ({
        id: shift.volunteer_id,
        name: shift.volunteer_name,
        email: 'N/A',
        assignmentId: shift.assignment_id,
        shift: shift.shift,
        status: 'absent',
        missedCheckin: true
      }));

      setVolunteers(prev => [
        ...prev.filter(v => !missedVolunteers.find(mv => mv.id === v.id)),
        ...missedVolunteers
      ]);

    } catch (error) {
      console.error('Error fetching shifts without check-in:', error);
      setError('Failed to load missed check-ins');
    } finally {
      setLoading(false);
    }
  };

  // REPLACE the existing filteredVolunteers calculation with this:
  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.collegeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift = !selectedShift || volunteer.shift === selectedShift;

    let matchesGroup = true;
    if (selectedGroup) {
      try {
        const selectedGroupData = JSON.parse(selectedGroup);
        // Find the volunteer's assignment to get notes
        const assignment = assignments.find(a => a.volunteer_id === volunteer.id);
        if (assignment && assignment.notes) {
          const notesParts = assignment.notes.split(',').map(note => note.trim());
          if (notesParts.length >= 2) {
            const volunteerGroup = notesParts[0];
            const volunteerCoordinator = notesParts[1];
            matchesGroup = volunteerGroup === selectedGroupData.group &&
              volunteerCoordinator === selectedGroupData.coordinator;
          } else {
            matchesGroup = false;
          }
        } else {
          matchesGroup = false;
        }
      } catch (e) {
        matchesGroup = false;
      }
    }

    return matchesSearch && matchesShift && matchesGroup;
  });

  const handleStartShift = (shift) => {
    setSelectedShift(shift);
    setActiveShift(true);
    setShowAttendance(true);
    fetchAttendanceData(); // Refresh attendance data when shift starts
  };

  const handleEndShift = async () => {
    try {
      setLoading(true);
      setError('');

      if (selectedShift) {
        const params = {
          event_id: '1', // Always use event_id = 1
          committee_id: id,
          shift: selectedShift,
          date: selectedDate
        };

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/attendance/checkout-shift?${new URLSearchParams(params)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to end shift');
        }

        const result = await response.json();
        alert(result.message || 'Shift ended successfully');
      }

      setActiveShift(false);
      setShowAttendance(false);
      setSelectedShift('');

      // Clear localStorage when shift ends
      localStorage.removeItem(`activeShift_${id}`);
      localStorage.removeItem(`selectedShift_${id}`);

      setVolunteers(prev => prev.map(volunteer => ({
        ...volunteer,
        status: 'assigned',
        attendanceId: null
      })));

      // Update the committee data in sessionStorage to reflect new stats
      await fetchCommitteeData();

    } catch (error) {
      console.error('Error ending shift:', error);
      setError('Failed to end shift: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExportAttendance = async () => {
    try {
      setLoading(true);

      // Export attendance CSV with filters
      const filters = {
        committee_id: id,
        date: selectedDate,
        ...(selectedShift && { shift: selectedShift })
      };

      const blob = await attendanceDetailAPI.exportAttendanceCSV(filters);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `attendance-committee-${id}-${selectedShift || 'all-shifts'}-${selectedDate}.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error exporting attendance data:', error);
      setError('Failed to export attendance data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = async (volunteerId) => {
    if (clickingVolunteer === volunteerId) return;

    try {
      setLoading(true);
      setError('');

      const volunteer = volunteers.find(v => v.id === volunteerId);

      if (volunteer.status === 'present' && volunteer.attendanceId) {
        // Check out the volunteer
        await attendanceDetailAPI.checkout({
          attendance_id: volunteer.attendanceId,
          time: new Date().toISOString()
        });

        setVolunteers(volunteers.map(v =>
          v.id === volunteerId
            ? { ...v, status: 'absent', attendanceId: null }
            : v
        ));

      } else if (volunteer.status !== 'present' && volunteer.assignmentId) {
        // Check in the volunteer
        try {
          const result = await attendanceDetailAPI.checkin({
            assignment_id: volunteer.assignmentId,
            lat: 0,
            lng: 0,
            time: new Date().toISOString()
          });

          setVolunteers(volunteers.map(v =>
            v.id === volunteerId
              ? { ...v, status: 'present', attendanceId: result.attendance_id }
              : v
          ));
        } catch (checkinError) {
          if (checkinError.response?.status === 409) {
            // Already checked in - sync the state
            setError('Volunteer is already checked in. Syncing status...');
            await fetchAttendanceData(); // Refresh to get current state
            return;
          }
          throw checkinError;
        }
      }

    } catch (error) {
      console.error('Error updating attendance:', error);
      if (error.response?.status === 409) {
        setError('This volunteer is already checked in. Refreshing status...');
        await fetchAttendanceData(); // Refresh data to sync state
      } else {
        setError('Failed to update attendance status');
      }
    } finally {
      setLoading(false);
      setClickingVolunteer(null);

    }
  };
  const handleVolunteersClick = () => {
    navigate(`/admin/volunteers/${id}`);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const getShiftVolunteerCount = (shift) => {
    return volunteers.filter(v => v.shift === shift).length;
  };

  const getShiftPresentCount = (shift) => {
    return volunteers.filter(v => v.shift === shift && v.status === 'present').length;
  };

  if (!committee) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">{committee.name}</h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span className="text-red-800 text-sm">{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'announcements'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            <Calendar className="inline mr-2" size={16} />
            Announcements
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'attendance'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            <Check className="inline mr-2" size={16} />
            Attendance
          </button>
          <button
            onClick={handleVolunteersClick}
            className="flex-1 py-3 px-4 text-center font-medium text-gray-600 hover:text-gray-800"
          >
            <Users className="inline mr-2" size={16} />
            Volunteers
          </button>
        </div>

        <div className="p-4">
          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-3">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{announcement.title}</h3>
                      {announcement.priority && (
                        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ml-2 ${announcement.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                          announcement.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                            announcement.priority === 'medium' ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-600'
                          }`}>
                          {announcement.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{announcement.body}</p>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                      <span>By: {announcement.created_by_name || 'Admin'}</span>
                      <span>{formatDate(announcement.created_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No announcements available for this committee</p>
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col gap-3">
                {/* Shift and Group selectors in one row on mobile */}
                <div className="flex flex-row gap-3">
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Shifts</option>
                    {availableShifts.map(shift => (
                      <option key={shift} value={shift}>{shift}</option>
                    ))}
                  </select>

                  {selectedShift && shiftGroups[selectedShift] && shiftGroups[selectedShift].length > 0 && (
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Groups</option>
                      {shiftGroups[selectedShift].map((groupData, index) => (
                        <option key={index} value={JSON.stringify(groupData)}>
                          {groupData.display}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              {/* Active Shift Display */}
              {/* Active Shift Display */}
              {activeShift && selectedShift && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div>
                    <h3 className="font-medium text-green-800">Active Shift: {selectedShift}</h3>
                    <p className="text-sm text-green-600">
                      {getShiftPresentCount(selectedShift)}/{getShiftVolunteerCount(selectedShift)} volunteers present
                    </p>
                  </div>
                </div>
              )}

              {/* Shift Management Buttons */}
              <div className="flex flex-row gap-3">
                {/* Start Shift Button - Only show when dropdown has selection and no active shift */}
                {!activeShift && selectedShift && availableShifts.includes(selectedShift) && (
                  <button
                    onClick={() => handleStartShift(selectedShift)}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    <span className="hidden sm:inline">Start {selectedShift}</span>
                    <span className="sm:hidden">Start</span>
                    <span className="text-sm opacity-80">
                      ({getShiftVolunteerCount(selectedShift)})
                    </span>
                  </button>
                )}

                {/* End Shift Button - Only show when shift is active */}
                {activeShift && selectedShift && (
                  <button
                    onClick={handleEndShift}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Square size={16} />
                    <span className="hidden sm:inline">End Shift</span>
                    <span className="sm:hidden">End</span>
                  </button>
                )}

                {/* Export Button */}
                <button
                  onClick={() => {
                    const originalShift = selectedShift;
                    handleExportAttendance().finally(() => {
                      // Don't change selectedShift for export since we want to maintain dropdown selection
                    });
                  }}
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export {selectedShift || 'All Shifts'}</span>
                  <span className="sm:hidden">Export</span>
                </button>
              </div>

              {showAttendance && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800">
                      {selectedShift ? `${selectedShift} Shift Attendance` : 'All Attendance'}
                    </h3>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search by name or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredVolunteers.map((volunteer) => (
                      <div key={volunteer.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800">{volunteer.name}</p>
                            {volunteer.missedCheckin && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                Missed Check-in
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Roll No: {volunteer.collegeId}</p>
                          {volunteer.shift && (
                            <p className="text-xs text-blue-600">Shift: {volunteer.shift}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleAttendance(volunteer.id)}
                            disabled={loading || !activeShift}
                            className={`px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${volunteer.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : activeShift
                                ? 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                              }`}
                          >
                            <Check size={16} className="inline mr-1" />
                            Present
                          </button>
                          <button
                            onClick={() => toggleAttendance(volunteer.id)}
                            disabled={loading || !activeShift}
                            className={`px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${volunteer.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : activeShift
                                ? 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-800'
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                              }`}
                          >
                            <X size={16} className="inline mr-1" />
                            Absent
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredVolunteers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No volunteers found</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommitteeDetail;