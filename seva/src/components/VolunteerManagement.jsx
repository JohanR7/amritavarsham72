import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, Users, Trash2, Download, Edit3, Save, X, AlertCircle } from 'lucide-react';
import { volunteersAPI, assignmentsAPI } from '../services/api'; // Import the API functions

const VolunteerManagement = () => {
  const { committeeId } = useParams();
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  
  const [assignments, setAssignments] = useState([]);
  const [committee, setCommittee] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  const [newVolunteer, setNewVolunteer] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    dept: '', 
    college_id: '',
    role: 'volunteer',
    reporting_time: '',
    shift: '',
    start_time: '',
    end_time: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventId] = useState(1);
  const [showCsvFormat, setShowCsvFormat] = useState(false);

  useEffect(() => {
    fetchCommitteeData();
    fetchVolunteersAndAssignments();
  }, [committeeId]);

  const fetchCommitteeData = async () => {
    try {
      // 1. First, try to get the specific 'currentCommittee'
      const currentCommittee = sessionStorage.getItem('currentCommittee');
      if (currentCommittee) {
        const committeeData = JSON.parse(currentCommittee);
        setCommittee(committeeData);
        return; // Data found, no need to go further
      }

      // 2. If that fails, try finding it in the 'committees' list (fallback)
      const allCommittees = sessionStorage.getItem('committees');
      if (allCommittees) {
        const committees = JSON.parse(allCommittees);
        const foundCommittee = committees.find(c => c.id.toString() === committeeId.toString());
        if (foundCommittee) {
          setCommittee(foundCommittee);
          return;
        }
      }

      // 3. If sessionStorage has nothing, fetch from the API as a last resort
      const response = await committeesAPI.getById(committeeId);
      setCommittee(response);
      
    } catch (error) {
      console.error('Error fetching committee data:', error);
      setError('Failed to load committee data');
    }
  };

  const fetchVolunteersAndAssignments = async () => {
    try {
      setLoading(true);
      
      // Fetch volunteers using the API function
      const volunteersData = await volunteersAPI.getAll({ limit: 500 });
      setVolunteers(volunteersData.data || volunteersData || []);

      // Fetch assignments for this committee using the API function
      const assignmentsData = await assignmentsAPI.getByCommittee(committeeId, { limit: 500 });
      setAssignments(assignmentsData.data || assignmentsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load volunteer data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVolunteer = async () => {
    if (!newVolunteer.name || !newVolunteer.email) {
      setError('Name and email are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Step 1: Check if volunteer already exists
      const existingVolunteer = volunteers.find(v => 
        v.email && v.email.toLowerCase() === newVolunteer.email.toLowerCase()
      );
      
      let volunteerId;

      if (existingVolunteer) {
        volunteerId = existingVolunteer.id;
        console.log('Using existing volunteer:', existingVolunteer);
      } else {
        // Step 2: Create new volunteer using the /volunteers endpoint
        const volunteerData = {
          name: newVolunteer.name,
          email: newVolunteer.email,
          phone: newVolunteer.phone || null,
          dept: newVolunteer.dept || null,
          college_id: newVolunteer.college_id || null
        };

        console.log('Creating new volunteer with data:', volunteerData);
        
        const createdVolunteer = await volunteersAPI.create(volunteerData);
        console.log('Created volunteer response:', createdVolunteer);
        
        // Update local volunteers state
        setVolunteers(prev => [...prev, createdVolunteer]);
        volunteerId = createdVolunteer.id;
      }

      // Step 3: Create assignment for the volunteer
      const assignmentData = {
        event_id: eventId, // You might need to get this from context or committee data
        committee_id: parseInt(committeeId),
        volunteer_id: volunteerId,
        role: newVolunteer.role,
        status: 'assigned',
        reporting_time: newVolunteer.reporting_time ? new Date(newVolunteer.reporting_time).toISOString() : null,
        shift: newVolunteer.shift || null,
        start_time: newVolunteer.start_time ? new Date(newVolunteer.start_time).toISOString() : null,
        end_time: newVolunteer.end_time ? new Date(newVolunteer.end_time).toISOString() : null,
        notes: newVolunteer.notes || null
      };

      console.log('Creating assignment with data:', assignmentData);
      
      const newAssignment = await assignmentsAPI.create(assignmentData);
      console.log('Created assignment response:', newAssignment);
      
      // Update local assignments state
      setAssignments(prev => [...prev, newAssignment]);
      
      // Reset form
      setNewVolunteer({ 
        name: '', email: '', phone: '', dept: '', college_id: '',
        role: 'volunteer', reporting_time: '', shift: '', start_time: '', end_time: '', notes: ''
      });
      setShowAddForm(false);

      // Show success message
      if (existingVolunteer) {
        alert('Assignment created for existing volunteer successfully!');
      } else {
        alert('Volunteer created and assigned successfully!');
      }

    } catch (error) {
      console.error('Error adding volunteer:', error);
      
      // More specific error handling
      if (error.response?.status === 409) {
        if (error.response.data.includes('Email already registered')) {
          setError('A volunteer with this email already exists');
        } else if (error.response.data.includes('college ID already exists')) {
          setError('A volunteer with this college ID already exists');
        } else {
          setError('Volunteer already exists with this information');
        }
      } else if (error.response?.status === 400) {
        setError('Invalid volunteer data: ' + (error.response.data || error.message));
      } else {
        setError('Failed to add volunteer: ' + (error.response?.data || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Use the bulkUpload API function
      const result = await volunteersAPI.bulkUpload(csvFile, eventId, parseInt(committeeId));

      
      // Show success message
      alert(`Upload successful! Created ${result.created_volunteers} volunteers and ${result.created_assignments} assignments. Updated ${result.updated_assignments} assignments.`);
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Upload errors:', result.errors);
        setError(`Upload completed with some errors. Check console for details.`);
      }

      // Refresh data
      fetchVolunteersAndAssignments();
      setCsvFile(null);

    } catch (error) {
      console.error('Error uploading CSV:', error);
      setError('Failed to upload CSV: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment({
      ...assignment,
      reporting_time: assignment.reporting_time || '',
      start_time: assignment.start_time || '',
      end_time: assignment.end_time || ''
    });
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;

    try {
      setLoading(true);
      setError('');

      const updateData = {
        role: editingAssignment.role,
        status: editingAssignment.status,
        reporting_time: editingAssignment.reporting_time ? new Date(editingAssignment.reporting_time).toISOString() : null,
        shift: editingAssignment.shift,
        start_time: editingAssignment.start_time ? new Date(editingAssignment.start_time).toISOString() : null,
        end_time: editingAssignment.end_time ? new Date(editingAssignment.end_time).toISOString() : null,
        notes: editingAssignment.notes
      };

      // Use the assignments API update function
      const updatedAssignment = await assignmentsAPI.update(editingAssignment.id, updateData);
      
      // Update local state
      setAssignments(prev => prev.map(assignment =>
        assignment.id === editingAssignment.id
          ? { ...assignment, ...updatedAssignment }
          : assignment
      ));
      setEditingAssignment(null);

    } catch (error) {
      console.error('Error updating assignment:', error);
      setError('Failed to update assignment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Use the assignments API delete function
      await assignmentsAPI.delete(assignmentId);
      setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));

    } catch (error) {
      console.error('Error removing assignment:', error);
      setError('Failed to remove assignment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportVolunteers = async () => {
    try {
      setLoading(true);
      
      // Use the volunteers API exportCSV function
      const blob = await volunteersAPI.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `volunteers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
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
      
      // Use the assignments API exportCSV function
      const blob = await assignmentsAPI.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assignments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error exporting assignments:', error);
      setError('Failed to export assignments');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    try {
      return new Date(dateTimeString).toLocaleString();
    } catch {
      return dateTimeString;
    }
  };

  const formatDateTimeInput = (dateTimeString) => {
    if (!dateTimeString) return '';
    try {
      const date = new Date(dateTimeString);
      return date.toISOString().slice(0, 16); // Format for datetime-local input
    } catch {
      return '';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/admin/committee/${committeeId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          Volunteer Management {committee && `- ${committee.name}`}
        </h1>
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

      {/* Upload and Add Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Volunteers</h2>
        
        <div className="space-y-4 mb-6">
          {/* CSV Upload */}
          {/* CSV Upload */}
<div className="w-full">
  <label className="flex items-center justify-center w-full h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
    <div className="flex items-center gap-3">
      <Upload className="w-5 h-5 text-gray-500" />
      <span className="text-sm text-gray-500 font-medium">
        {csvFile ? csvFile.name : 'Click to upload CSV'}
      </span>
    </div>
    <input
      type="file"
      className="hidden"
      accept=".csv"
      onChange={(e) => setCsvFile(e.target.files[0])}
    />
  </label>
            
  {csvFile && (
    <div className="flex gap-2 mt-2">
      <button
        onClick={handleCsvUpload}
        disabled={loading}
        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Uploading...' : 'Upload CSV'}
      </button>
      <button
        onClick={() => setCsvFile(null)}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
      >
        Clear
      </button>
    </div>
  )}
</div>

          <div className="flex flex-col sm:flex-row gap-3">
  <button
    onClick={() => setShowAddForm(true)}
    disabled={loading}
    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
    <Plus size={18} />
    Add Manually
  </button>
</div>

<div className="flex-1">
  <select
    onChange={(e) => {
      if (e.target.value === 'volunteers') {
        handleExportVolunteers();
        e.target.value = ''; // Reset dropdown
      } else if (e.target.value === 'assignments') {
        handleExportAssignments();
        e.target.value = ''; // Reset dropdown
      }
    }}
    disabled={loading}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
  >
    <option value="">Export Data...</option>
    <option value="volunteers">Export Volunteers</option>
    <option value="assignments">Export Assignments</option>
  </select>
</div>
        </div>

        {/* CSV Format Toggle */}
<div className="text-center">
  <button
    onClick={() => setShowCsvFormat(!showCsvFormat)}
    className="text-blue-600 text-sm underline hover:text-blue-800"
  >
    {showCsvFormat ? 'Hide' : 'Show'} CSV Format Info
  </button>
</div>

{/* CSV Format Info */}
{showCsvFormat && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
    <p className="text-sm text-blue-800">
      <strong>CSV Format:</strong> name,email,phone,dept,college_id,reporting_time_iso,shift,start_time_iso,end_time_iso,role,status,notes
    </p>
    <p className="text-xs text-blue-600 mt-1">
      <strong>Example:</strong> John Doe,john@example.com,123-456-7890,CS,V1001,2025-10-26T08:00:00+05:30,Morning Shift,2025-10-26T09:00:00+05:30,2025-10-26T13:00:00+05:30,lead,assigned,Oversee setup
    </p>
    <p className="text-xs text-blue-600 mt-1">
      <strong>Note:</strong> Times should be in RFC3339 format (ISO 8601 with timezone)
    </p>
  </div>
)}
      </div>

      {/* Add Manual Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Volunteer & Assignment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Volunteer Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Volunteer Information</h4>
                
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newVolunteer.name}
                  onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                
                <input
                  type="email"
                  placeholder="Email *"
                  value={newVolunteer.email}
                  onChange={(e) => setNewVolunteer({...newVolunteer, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newVolunteer.phone}
                  onChange={(e) => setNewVolunteer({...newVolunteer, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <input
                  type="text"
                  placeholder="Department"
                  value={newVolunteer.dept}
                  onChange={(e) => setNewVolunteer({...newVolunteer, dept: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <input
                  type="text"
                  placeholder="College ID"
                  value={newVolunteer.college_id}
                  onChange={(e) => setNewVolunteer({...newVolunteer, college_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Assignment Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Assignment Information</h4>
                
                <select
                  value={newVolunteer.role}
                  onChange={(e) => setNewVolunteer({...newVolunteer, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="volunteer">Volunteer</option>
                  <option value="lead">Team Lead</option>
                  <option value="support">Support</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Shift (e.g., Morning Shift)"
                  value={newVolunteer.shift}
                  onChange={(e) => setNewVolunteer({...newVolunteer, shift: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Time</label>
                  <input
                    type="datetime-local"
                    value={newVolunteer.reporting_time}
                    onChange={(e) => setNewVolunteer({...newVolunteer, reporting_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newVolunteer.start_time}
                    onChange={(e) => setNewVolunteer({...newVolunteer, start_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={newVolunteer.end_time}
                    onChange={(e) => setNewVolunteer({...newVolunteer, end_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <textarea
                  placeholder="Notes"
                  value={newVolunteer.notes}
                  onChange={(e) => setNewVolunteer({...newVolunteer, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddVolunteer}
                disabled={loading || !newVolunteer.name || !newVolunteer.email}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Volunteer'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewVolunteer({ 
                    name: '', email: '', phone: '', dept: '', college_id: '',
                    role: 'volunteer', reporting_time: '', shift: '', start_time: '', end_time: '', notes: ''
                  });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volunteers & Assignments List */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users size={20} />
            Committee Assignments ({assignments.length})
          </h2>
        </div>

        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
              {editingAssignment && editingAssignment.id === assignment.id ? (
                // Edit Form
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Assignment Details</h4>
                    
                    <select
                      value={editingAssignment.role}
                      onChange={(e) => setEditingAssignment({...editingAssignment, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="volunteer">Volunteer</option>
                      <option value="lead">Team Lead</option>
                      <option value="support">Support</option>
                    </select>
                    
                    <select
                      value={editingAssignment.status}
                      onChange={(e) => setEditingAssignment({...editingAssignment, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="assigned">Assigned</option>
                      <option value="standby">Standby</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Shift"
                      value={editingAssignment.shift}
                      onChange={(e) => setEditingAssignment({...editingAssignment, shift: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Schedule</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Time</label>
                      <input
                        type="datetime-local"
                        value={formatDateTimeInput(editingAssignment.reporting_time)}
                        onChange={(e) => setEditingAssignment({...editingAssignment, reporting_time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={formatDateTimeInput(editingAssignment.start_time)}
                        onChange={(e) => setEditingAssignment({...editingAssignment, start_time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        value={formatDateTimeInput(editingAssignment.end_time)}
                        onChange={(e) => setEditingAssignment({...editingAssignment, end_time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <textarea
                      placeholder="Notes"
                      value={editingAssignment.notes || ''}
                      onChange={(e) => setEditingAssignment({...editingAssignment, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-16 resize-none"
                    />
                  </div>
                  
                  <div className="lg:col-span-2 flex gap-2">
                    <button
                      onClick={handleUpdateAssignment}
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save size={16} />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingAssignment(null)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-800">
                        {assignment.volunteer_name || `Volunteer ID: ${assignment.volunteer_id}`}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        assignment.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        assignment.status === 'standby' ? 'bg-yellow-100 text-yellow-800' :
                        assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                    
                    {assignment.volunteer_email && (
                      <p className="text-sm text-gray-600 mb-1">{assignment.volunteer_email}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Role:</span> {assignment.role}
                      </div>
                      <div>
                        <span className="font-medium">Shift:</span> {assignment.shift || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Reporting:</span> {assignment.reporting_time ? formatDateTime(assignment.reporting_time) : 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> 
                        {assignment.start_time && assignment.end_time 
                          ? `${formatDateTime(assignment.start_time)} - ${formatDateTime(assignment.end_time)}`
                          : 'N/A'
                        }
                      </div>
                    </div>
                    
                    {assignment.notes && (
                      <div className="mt-2">
                        <span className="font-medium text-sm text-gray-700">Notes:</span>
                        <p className="text-sm text-gray-600 mt-1">{assignment.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditAssignment(assignment)}
                      disabled={loading}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit Assignment"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      disabled={loading}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove Assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {assignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No volunteer assignments yet</p>
              <p className="text-sm">Upload a CSV file or add volunteers manually to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerManagement;