const State = {
  data: {
    user: null, 
    appointments: [], 
    hospitals: [
      { id: 'h1', name: 'Apollo Hospitals Kakinada', location: 'Kakinada', code: 'APO' },
      { id: 'h2', name: 'Medicover Hospitals Kakinada', location: 'Kakinada', code: 'MED' },
      { id: 'h3', name: 'Inodaya Hospitals', location: 'Kakinada', code: 'INO' },
      { id: 'h4', name: 'Aruna Multispeciality Hospital', location: 'Kakinada', code: 'ARU' },
      { id: 'h5', name: 'Surya Global Multi Speciality Hospital', location: 'Kakinada', code: 'SUR' },
      { id: 'h6', name: 'Bhanu Multispeciality Hospital', location: 'Kakinada', code: 'BHA' },
      { id: 'h7', name: 'Laxmi Hospital', location: 'Kakinada', code: 'LAX' },
      { id: 'h8', name: 'VMS (Vishnu Multi Specialty Hospital)', location: 'Kakinada', code: 'VMS' },
      { id: 'h9', name: 'Government General Hospital Kakinada', location: 'Kakinada', code: 'GGH' },
      { id: 'h10', name: 'Hope Hospital Kakinada', location: 'Kakinada', code: 'HOP' },
      { id: 'h11', name: 'Siddhartha Hospital Kakinada', location: 'Kakinada', code: 'SID' },
      { id: 'h12', name: 'Trust Hospital Kakinada', location: 'Kakinada', code: 'TRU' },
      { id: 'h13', name: 'Sri Sai Hospital Kakinada', location: 'Kakinada', code: 'SRI' }
    ],
    purposes: [
      { id: 'p1', name: 'General Consultation', icon: 'fa-user-md' },
      { id: 'p2', name: 'Specialist Consultation', icon: 'fa-stethoscope' },
      { id: 'p3', name: 'Lab Test / Diagnostics', icon: 'fa-vial' },
      { id: 'p4', name: 'Follow-up Visit', icon: 'fa-calendar-check' },
      { id: 'p5', name: 'Emergency / Priority', icon: 'fa-ambulance' },
      { id: 'p6', name: 'Vaccination', icon: 'fa-syringe' },
      { id: 'p7', name: 'Other', icon: 'fa-plus-circle' }
    ],
    queues: {} // map of hospitalId -> { currentToken, nextToken }
  },

  init() {
    const saved = localStorage.getItem('smartQueueDataV2');
    if (saved) {
      this.data = JSON.parse(saved);
      // Migration for old data or missing queues
      if (!this.data.queues) this.data.queues = {};
      this.data.hospitals.forEach(h => {
        if (!this.data.queues[h.id]) {
          this.data.queues[h.id] = { currentToken: 101, nextToken: 101 };
        }
      });
    } else {
      this.data.hospitals.forEach(h => {
        this.data.queues[h.id] = { currentToken: 101, nextToken: 101 };
      });
      this.save();
    }
  },

  save() {
    localStorage.setItem('smartQueueDataV2', JSON.stringify(this.data));
  },

  login(phone, name) {
    if (phone === 'admin') {
      this.data.user = { id: 0, name: 'Administrator', phone: 'admin', isAdmin: true };
    } else {
      this.data.user = { id: Date.now(), name: name || 'User', phone: phone, isAdmin: false };
    }
    this.save();
    return true;
  },

  logout() {
    this.data.user = null;
    this.save();
  },

  bookAppointment(hospitalId, purposeId, date, time) {
    const hospital = this.data.hospitals.find(h => h.id === hospitalId);
    const purpose = this.data.purposes.find(p => p.id === purposeId);
    
    const dateObj = new Date(date + ', ' + new Date().getFullYear());
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}${mm}${dd}`;
    
    const dailyAppts = this.data.appointments.filter(
      a => a.hospitalId === hospitalId && a.date === date
    );
    const nextNumber = dailyAppts.length + 1;
    const token = `${hospital.code || 'HOS'}-${dateKey}-${String(nextNumber).padStart(3, '0')}`;
    
    const queueKey = `${hospitalId}_${date}`;
    if (!this.data.queues[queueKey]) {
      this.data.queues[queueKey] = { currentToken: token };
    }
    
    const appt = {
      id: Date.now(),
      userId: this.data.user.id,
      userName: this.data.user.name,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      purposeId: purpose.id,
      purposeName: purpose.name,
      date, 
      time,
      status: 'pending', // pending -> approved -> completed
      token: token
    };
    
    this.data.appointments.push(appt);
    this.save();
    return appt;
  },

  getUserAppointments() {
    if (!this.data.user) return [];
    return this.data.appointments.filter(a => a.userId === this.data.user.id).sort((a, b) => b.id - a.id);
  },

  getLatestActiveAppointment() {
    const userAppts = this.getUserAppointments();
    return userAppts.find(a => a.status === 'approved' || a.status === 'pending');
  },

  getAllAppointments() {
    return this.data.appointments.sort((a, b) => b.id - a.id);
  },

  updateAppointmentStatus(id, status) {
    const appt = this.data.appointments.find(a => a.id === id);
    if (appt) {
      appt.status = status;
      this.save();
    }
  },

  advanceToken(hospitalId) {
    const today = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric' });
    const queueKey = `${hospitalId}_${today}`;
    
    const dailyAppts = this.data.appointments.filter(
      a => a.hospitalId === hospitalId && a.date === today
    ).sort((a, b) => a.id - b.id);
    
    let currentData = this.data.queues[queueKey] || { currentToken: 'None' };
    
    let foundCurrent = false;
    let nextToken = currentData.currentToken;
    
    for (let i = 0; i < dailyAppts.length; i++) {
       if (currentData.currentToken === 'None' || foundCurrent) {
          nextToken = dailyAppts[i].token;
          break;
       }
       if (dailyAppts[i].token === currentData.currentToken) {
          foundCurrent = true;
       }
    }
    
    this.data.queues[queueKey] = { currentToken: nextToken };
    this.save();
    return nextToken;
  },
  
  getHospitalQueueStats(hospitalId, date) {
    const targetDate = date || new Date().toLocaleString('en-US', { month: 'long', day: 'numeric' });
    const queueKey = `${hospitalId}_${targetDate}`;
    
    if (!this.data.queues[queueKey]) {
      const dailyAppts = this.data.appointments.filter(
        a => a.hospitalId === hospitalId && a.date === targetDate
      ).sort((a, b) => a.id - b.id);
      
      const currentToken = dailyAppts.length > 0 ? dailyAppts[0].token : 'None';
      return { currentToken: currentToken };
    }
    return this.data.queues[queueKey];
  },

  getAdminStats() {
    const all = this.data.appointments;
    const total = all.length;
    
    const purposeStats = {};
    const dailyBookings = {};
    
    all.forEach(a => {
      purposeStats[a.purposeName] = (purposeStats[a.purposeName] || 0) + 1;
      dailyBookings[a.date] = (dailyBookings[a.date] || 0) + 1;
    });

    return { total, purposeStats, dailyBookings };
  }
};

State.init();
