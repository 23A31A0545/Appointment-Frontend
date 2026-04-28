const App = {
  currentView: 'login',
  
  // Booking State
  booking: {
    hospitalId: null,
    purposeId: null,
    date: new Date().toLocaleString('en-US', { month: 'long', day: 'numeric' }),
    time: null
  },

  // Admin State
  admin: {
    hospitalId: 'h1'
  },

  init() {
    this.container = document.getElementById('app');
    this.toastContainer = document.getElementById('toast-container');
    
    if (State.data.user) {
      if (State.data.user.isAdmin) {
        this.navigate('admin');
      } else {
        this.navigate('home');
      }
    } else {
      this.navigate('login');
    }
  },

  navigate(view) {
    this.currentView = view;
    window.scrollTo(0, 0);
    this.render();
  },

  startBooking() {
    this.booking = { 
      hospitalId: null, 
      purposeId: null, 
      date: new Date().toLocaleString('en-US', { month: 'long', day: 'numeric' }), 
      time: null 
    };
    this.navigate('booking_hospital');
  },

  render() {
    this.container.innerHTML = '';
    
    if (this.currentView === 'login') {
      this.container.innerHTML = Components.LoginView();
      document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        State.login(phone, name);
        if (phone === 'admin') {
          this.navigate('admin');
        } else {
          this.navigate('home');
        }
      });
    } 
    else if (this.currentView === 'home') {
      const user = State.data.user;
      const activeAppt = State.getLatestActiveAppointment();
      let queueStats = null;
      if (activeAppt) {
        queueStats = State.getHospitalQueueStats(activeAppt.hospitalId);
      }
      this.container.innerHTML = Components.UserDashboard(user, activeAppt, queueStats);
    }
    // Booking Flow
    else if (this.currentView === 'booking_hospital') {
      this.container.innerHTML = Components.BookingHospitalView(State.data.hospitals);
      if (this.booking.hospitalId) {
        setTimeout(() => document.getElementById('hospital-' + this.booking.hospitalId)?.classList.add('active'), 0);
      }
    }
    else if (this.currentView === 'booking_purpose') {
      this.container.innerHTML = Components.BookingPurposeView(State.data.purposes);
      if (this.booking.purposeId) {
        setTimeout(() => document.getElementById('purpose-' + this.booking.purposeId)?.classList.add('active'), 0);
      }
    }
    else if (this.currentView === 'booking_slot') {
      const dates = this.getAvailableDates();
      const slots = this.getAvailableTimeSlots(this.booking.date);
      this.container.innerHTML = Components.BookingSlotView(dates, slots, this.booking.date, this.booking.time);
    }
    else if (this.currentView === 'booking_confirm') {
      const h = State.data.hospitals.find(x => x.id === this.booking.hospitalId);
      const p = State.data.purposes.find(x => x.id === this.booking.purposeId);
      this.container.innerHTML = Components.BookingConfirmView(h, p, this.booking.date, this.booking.time);
    }
    // History
    else if (this.currentView === 'history') {
      const appointments = State.getUserAppointments();
      this.container.innerHTML = Components.HistoryView(appointments);
    }
    // Admin
    else if (this.currentView === 'admin') {
      const stats = State.getAdminStats();
      const hospitalAppts = State.data.appointments.filter(a => a.hospitalId === this.admin.hospitalId).sort((a,b) => b.id - a.id);
      const queueStats = State.getHospitalQueueStats(this.admin.hospitalId);
      this.container.innerHTML = Components.AdminDashboard(stats, State.data.hospitals, this.admin.hospitalId, queueStats, hospitalAppts);
    }
  },

  logout() {
    State.logout();
    this.navigate('login');
  },

  // Booking Actions
  selectHospital(id) {
    this.booking.hospitalId = id;
    document.querySelectorAll('.list-card').forEach(el => el.classList.remove('active'));
    document.getElementById('hospital-' + id).classList.add('active');
    setTimeout(() => this.navigate('booking_purpose'), 300); // Auto-advance for better UX
  },

  selectPurpose(id) {
    this.booking.purposeId = id;
    document.querySelectorAll('.list-card').forEach(el => el.classList.remove('active'));
    document.getElementById('purpose-' + id).classList.add('active');
  },

  selectDate(el, date) {
    if (el.classList.contains('disabled')) return;
    this.booking.date = date;
    document.querySelectorAll('.calendar-day').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
  },

  selectTime(el, time) {
    if (el.classList.contains('disabled')) return;
    this.booking.time = time;
    document.querySelectorAll('.time-slot').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
  },

  confirmBooking() {
    if (!this.booking.hospitalId || !this.booking.purposeId || !this.booking.time) {
      this.showToast('Error', 'Please complete all selections first.', 'error');
      return;
    }

    const btn = document.querySelector('.btn-primary');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    setTimeout(() => {
      const appt = State.bookAppointment(
        this.booking.hospitalId, 
        this.booking.purposeId, 
        this.booking.date, 
        this.booking.time
      );
      this.showToast('Appointment Confirmed!', `Your token is #${appt.token}`, 'success');
      this.navigate('home');
      
      // Notify them of upcoming turn
      setTimeout(() => {
        this.showToast('Turn is Near', 'Please reach the hospital reception.', 'info');
      }, 5000);
    }, 1000);
  },

  // Admin Actions
  adminSelectHospital(id) {
    this.admin.hospitalId = id;
    this.render();
  },

  adminNextToken() {
    const next = State.advanceToken(this.admin.hospitalId);
    this.showToast('Queue Updated', `Token #${next} is now active.`, 'info');
    this.render();
  },

  adminUpdateStatus(id, status) {
    State.updateAppointmentStatus(id, status);
    this.showToast('Status Updated', `Appointment marked as ${status}`, 'success');
    this.render();
  },

  // Date/Time Utilities
  getAvailableDates() {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push({
        label: d.toLocaleString('en-US', { month: 'long', day: 'numeric' }),
        day: d.getDate(),
        dayName: d.toLocaleString('en-US', { weekday: 'short' }),
        isToday: i === 0
      });
    }
    return dates;
  },

  getAvailableTimeSlots(selectedDateStr) {
    const slots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
      '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
      '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
      '04:00 PM', '04:30 PM', '05:00 PM'
    ];
    
    const now = new Date();
    const isToday = selectedDateStr === now.toLocaleString('en-US', { month: 'long', day: 'numeric' });
    
    return slots.map(timeStr => {
      let isDisabled = false;
      if (isToday) {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
        
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        
        if (slotTime <= now) {
          isDisabled = true;
        }
      }
      return { time: timeStr, disabled: isDisabled };
    });
  },

  // UI Utilities
  showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    let icon = 'fa-info-circle';
    let color = 'var(--primary)';
    
    if (type === 'success') {
      icon = 'fa-check-circle';
      color = 'var(--secondary)';
    } else if (type === 'error') {
      icon = 'fa-exclamation-circle';
      color = '#dc2626';
    }
    
    toast.style.borderLeftColor = color;
    toast.innerHTML = `
      <div class="toast-icon" style="color: ${color};"><i class="fas ${icon}"></i></div>
      <div class="toast-content">
        <h4>${title}</h4>
        <p>${message}</p>
      </div>
    `;
    
    this.toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
