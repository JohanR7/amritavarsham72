import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Plus, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [committees, setCommittees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showCreateCommittee, setShowCreateCommittee] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [committeeName, setCommitteeName] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  
  const navigate = useNavigate();

  // Dummy data
  useEffect(() => {
    setCommittees([
      { id: 1, name: 'Event Management', totalVolunteers: 25, present: 20, absent: 5 },
      { id: 2, name: 'Security Team', totalVolunteers: 15, present: 12, absent: 3 },
      { id: 3, name: 'Registration Desk', totalVolunteers: 10, present: 8, absent: 2 }
    ]);

    setAnnouncements([
      { id: 1, title: 'Welcome Event', content: 'Welcome to the new semester!', date: '2024-03-15' },
      { id: 2, title: 'Committee Updates', content: 'All committee heads please check in.', date: '2024-03-14' }
    ]);
  }, []);

  const handleCreateCommittee = () => {
    if (committeeName.trim()) {
      const newCommittee = {
        id: committees.length + 1,
        name: committeeName,
        totalVolunteers: 0,
        present: 0,
        absent: 0
      };
      setCommittees([...committees, newCommittee]);
      setCommitteeName('');
      setShowCreateCommittee(false);
    }
  };

  const handleCreateAnnouncement = () => {
    if (announcementTitle.trim() && announcementContent.trim()) {
      const newAnnouncement = {
        id: announcements.length + 1,
        title: announcementTitle,
        content: announcementContent,
        date: new Date().toISOString().split('T')[0]
      };
      setAnnouncements([newAnnouncement, ...announcements]);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setShowCreateAnnouncement(false);
    }
  };

  const handleCommitteeClick = (committeeId) => {
    navigate(`/admin/committee/${committeeId}`);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header with Options Menu */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical size={20} />
          </button>
          
          {showOptionsMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setShowCreateCommittee(true);
                  setShowOptionsMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={16} />
                Create Committee
              </button>
            </div>
          )}
        </div>
      </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateCommittee}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateCommittee(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Announcements</h2>
          <button
            onClick={() => setShowCreateAnnouncement(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            New
          </button>
        </div>

        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="border border-gray-200 rounded-lg p-3">
              <h3 className="font-medium text-gray-800">{announcement.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{announcement.content}</p>
              <p className="text-xs text-gray-500 mt-2">{announcement.date}</p>
            </div>
          ))}
        </div>
      </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
            />
            <textarea
              placeholder="Announcement Content"
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 h-24 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateAnnouncement}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateAnnouncement(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Committees Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Committees</h2>
        
        <div className="space-y-3">
          {committees.map((committee) => (
            <div
              key={committee.id}
              onClick={() => handleCommitteeClick(committee.id)}
              className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-800 mb-2">{committee.name}</h3>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-blue-600">
                    <Users size={16} />
                    <span>{committee.totalVolunteers}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={16} />
                    <span>{committee.present}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle size={16} />
                    <span>{committee.absent}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;