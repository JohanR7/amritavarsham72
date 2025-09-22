import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/auth/refresh`, {
            refresh_token: refreshToken
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          
          localStorage.setItem('access_token', access_token);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  refresh: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout', { refresh_token: refreshToken });
    return response.data;
  }
};

// Announcements API endpoints
export const announcementsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  getMyAnnouncements: async (params = {}) => {
    const response = await api.get('/announcements/me', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }
};


// Committees API endpoints
export const committeesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/committees', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/committees/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/committees', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/committees/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/committees/${id}`);
    return response.data;
  }
};

// Volunteers API endpoints
export const volunteersAPI = {
  // Get all volunteers
  getAll: async (params = {}) => {
    const response = await api.get('/volunteers', { params });
    return response.data;
  },

  // Get specific volunteer by ID
  getById: async (id) => {
    const response = await api.get(`/volunteers/${id}`);
    return response.data;
  },

  // Get volunteer assignments
  getAssignments: async (params = {}) => {
    const response = await api.get('/volunteers/assignments', { params });
    console.log('Volunteer Assignments Response:', response.data);
    return response.data;
  },

  // Create a single volunteer
  create: async (data) => {
    // Ensure data is properly formatted for the API
    const volunteerData = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      dept: data.dept || null,
      college_id: data.college_id || null,
      password: data.password || null // Optional password field
    };
    
    const response = await api.post('/volunteers', volunteerData);
    return response.data;
  },

  // Update volunteer
  update: async (id, data) => {
    const response = await api.put(`/volunteers/${id}`, data);
    return response.data;
  },

  // Delete volunteer
  delete: async (id) => {
    const response = await api.delete(`/volunteers/${id}`);
    return response.data;
  },

  // Bulk upload volunteers via CSV
  bulkUpload: async (file, eventId, committeeId) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/volunteers/bulk?event_id=${eventId}&committee_id=${committeeId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Export volunteers to CSV
  exportCSV: async () => {
    const response = await api.get('/volunteers/export_csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export assignments to CSV
  exportAssignments: async () => {
    const response = await api.get('/volunteers/assignments/export_csv', {
      responseType: 'blob',
    });
    return response.data;
  }
};

// Volunteer Assignments API endpoints
export const assignmentsAPI = {
  // Get assignments for a specific committee
  getByCommittee: async (committeeId, params = {}) => {
    const queryParams = new URLSearchParams({ committee_id: committeeId, ...params });
    const response = await api.get(`/volunteers/assignments?${queryParams}`);
    return response.data;
  },

  // Get all assignments
  getAll: async (params = {}) => {
    const response = await api.get('/volunteers/assignments', { params });
    return response.data;
  },

  // Get specific assignment by ID
  getById: async (id) => {
    const response = await api.get(`/volunteers/assignments/${id}`);
    return response.data;
  },

  // Create new assignment
  create: async (data) => {
    // Ensure proper data formatting for the assignment API
    const assignmentData = {
      event_id: data.event_id,
      committee_id: data.committee_id,
      volunteer_id: data.volunteer_id,
      role: data.role || 'volunteer',
      status: data.status || 'assigned',
      reporting_time: data.reporting_time || null,
      shift: data.shift || null,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      notes: data.notes || null
    };

    const response = await api.post('/volunteers/assignments', assignmentData);
    return response.data;
  },

  // Update assignment
  update: async (id, data) => {
    const response = await api.put(`/volunteers/assignments/${id}`, data);
    return response.data;
  },

  // Delete assignment
  delete: async (id) => {
    const response = await api.delete(`/volunteers/assignments/${id}`);
    return response.data;
  },

  // Export assignments to CSV
  exportCSV: async () => {
    const response = await api.get('/volunteers/assignments/export_csv', {
      responseType: 'blob',
    });
    return response.data;
  }
};

// Attendance API endpoints
export const attendanceAPI = {
  exportAttendanceCSV: async (filters = {}) => {
    const response = await api.get('/attendance/export_csv', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
  checkin: async (data) => {
    const response = await api.post('/attendance/checkin', data);
    return response.data;
  },

  checkout: async (data) => {
    const response = await api.post('/attendance/checkout', data);
    return response.data;
  },

  // Get active volunteers in committee
  getActiveInCommittee: async (params = {}) => {
    const response = await api.get('/attendance/active-in-committee', { params });
    return response.data;
  },

  // Get shifts without checkin
  getShiftsWithoutCheckin: async (params = {}) => {
    const response = await api.get('/attendance/shifts-without-checkin', { params });
    return response.data;
  },

  // Checkout shift
  checkoutShift: async (params = {}) => {
    const response = await api.post('/attendance/checkout-shift', null, { params });
    return response.data;
  },

  // Get attendance records for a committee/assignment
  getByCommittee: async (committeeId, params = {}) => {
    const response = await api.get(`/attendance/committee/${committeeId}`, { params });
    return response.data;
  },

  // Approve attendance (admin function)
  approve: async (attendanceId) => {
    const response = await api.put(`/attendance/${attendanceId}/approve`);
    return response.data;
  },

  // Mark as absent (admin function)
  markAbsent: async (assignmentId, volunteerId, date) => {
    const response = await api.post('/attendance/mark-absent', {
      assignment_id: assignmentId,
      volunteer_id: volunteerId,
      date
    });
    return response.data;
  },

  // Update attendance status (for committee management)
  updateStatus: async (attendanceId, status) => {
    const response = await api.put(`/attendance/${attendanceId}/status`, {
      status
    });
    return response.data;
  },
  getAssignmentsWithStatus: async (params = {}) => {
  const response = await api.get('/attendance/assignments-status', { params });
  return response.data;
},
};

// Export attendanceDetailAPI as an alias for backward compatibility
export const attendanceDetailAPI = attendanceAPI;

export default api;