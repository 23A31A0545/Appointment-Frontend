const Components = {
  LoginView: () => `
    <div class="auth-container fade-in">
      <div class="auth-header">
        <i class="fas fa-heartbeat logo-icon"></i>
        <h1>Smart Queue</h1>
        <p>Book appointments & track your queue</p>
      </div>
      <form id="loginForm">
        <div class="input-group">
          <label>Full Name</label>
          <input type="text" id="name" class="input-control" placeholder="John Doe" required>
        </div>
        <div class="input-group">
          <label>Phone Number (Use 'admin' for Admin)</label>
          <input type="text" id="phone" class="input-control" placeholder="Enter phone number" required>
        </div>
        <button type="submit" class="btn btn-primary mt-4">
          <span>Continue</span> <i class="fas fa-arrow-right"></i>
        </button>
      </form>
    </div>
  `,

  Stepper: (currentStep) => `
    <div class="stepper mb-4">
      <div class="step ${currentStep >= 1 ? (currentStep > 1 ? 'completed' : 'active') : ''}">
        <div class="step-circle"><i class="fas ${currentStep > 1 ? 'fa-check' : 'fa-hospital'}"></i></div>
        <div class="step-label">Hospital</div>
      </div>
      <div class="step ${currentStep >= 2 ? (currentStep > 2 ? 'completed' : 'active') : ''}">
        <div class="step-circle"><i class="fas ${currentStep > 2 ? 'fa-check' : 'fa-stethoscope'}"></i></div>
        <div class="step-label">Purpose</div>
      </div>
      <div class="step ${currentStep >= 3 ? (currentStep > 3 ? 'completed' : 'active') : ''}">
        <div class="step-circle"><i class="fas ${currentStep > 3 ? 'fa-check' : 'fa-clock'}"></i></div>
        <div class="step-label">Slot</div>
      </div>
      <div class="step ${currentStep >= 4 ? 'active' : ''}">
        <div class="step-circle"><i class="fas fa-check-circle"></i></div>
        <div class="step-label">Confirm</div>
      </div>
    </div>
  `,

  UserDashboard: (user, activeAppt, queueStats) => {
    let queuePos = 0;
    let waitTime = 0;
    if (activeAppt && queueStats) {
      const myTokenNum = parseInt(activeAppt.token.split('-').pop()) || 0;
      let currentTokenNum = 0;
      if (queueStats.currentToken && queueStats.currentToken !== 'None') {
          if (typeof queueStats.currentToken === 'string' && queueStats.currentToken.includes('-')) {
              currentTokenNum = parseInt(queueStats.currentToken.split('-').pop()) || 0;
          } else {
              currentTokenNum = queueStats.currentToken; // fallback
          }
      }
      queuePos = Math.max(0, myTokenNum - currentTokenNum);
      waitTime = queuePos * 15; // Assuming 15 mins per patient
    }

    return `
    <div class="app-container fade-in">
      <div class="header">
        <div class="greeting">
          <div>
            <h2 class="header-title">Hello, ${user.name.split(' ')[0]} 👋</h2>
            <p class="header-subtitle">How are you feeling today?</p>
          </div>
          <div class="avatar"><i class="fas fa-user"></i></div>
        </div>
      </div>

      <div class="p-4 pt-0">
        ${activeAppt ? `
          <div class="card mb-4" style="border-color: var(--primary);">
            <div class="d-flex justify-between align-center mb-3">
              <h3 style="font-size: 1rem;">Active Appointment</h3>
              <span class="badge badge-${activeAppt.status}">${activeAppt.status.toUpperCase()}</span>
            </div>
            
            <p class="text-center font-bold text-primary mb-1">${activeAppt.hospitalName}</p>
            <p class="text-center text-muted mb-3" style="font-size: 0.875rem;">${activeAppt.purposeName}</p>
            
            <div class="token-display">
              <div class="token-label">Your Token</div>
              <div class="token-number">#${activeAppt.token}</div>
              <div class="token-meta">
                <div class="token-status"><i class="fas fa-users me-1"></i> Running: #${queueStats.currentToken}</div>
              </div>
            </div>
            
            <div class="queue-stats">
              <div class="stat-box">
                <div class="stat-box-value">${queuePos}</div>
                <div class="stat-box-label">People Ahead</div>
              </div>
              <div class="stat-box">
                <div class="stat-box-value" style="color: var(--secondary);">${waitTime}</div>
                <div class="stat-box-label">Mins Wait</div>
              </div>
            </div>
            
            <p class="text-center text-muted mb-2 mt-2">
              <i class="fas fa-calendar-alt me-1"></i> ${activeAppt.date} | <i class="fas fa-clock me-1"></i> ${activeAppt.time}
            </p>
          </div>
        ` : `
          <div class="empty-state mb-4">
            <div class="empty-state-icon">
              <i class="far fa-calendar-plus"></i>
            </div>
            <h3>No Active Appointments</h3>
            <p>Book your next visit to see it here.</p>
          </div>
        `}

        <button class="btn btn-primary" onclick="App.startBooking()">
          <i class="fas fa-plus"></i> Book New Appointment
        </button>
      </div>
      
      ${Components.BottomNav('home')}
    </div>
  `},

  BookingHospitalView: (hospitals) => `
    <div class="app-container fade-in">
      <div class="header" style="border-radius: 0; padding-bottom: 1rem;">
        <div class="d-flex align-center gap-2">
          <button class="btn btn-outline btn-small" style="color: white; border-color: rgba(255,255,255,0.3);" onclick="App.navigate('home')">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h2 class="header-title" style="margin: 0; font-size: 1.25rem;">Select Hospital</h2>
        </div>
      </div>
      <div class="p-4 pt-3">
        ${Components.Stepper(1)}
        <div class="selection-list">
          ${hospitals.map(h => `
            <div class="list-card" onclick="App.selectHospital('${h.id}')" id="hospital-${h.id}">
              <div class="list-icon"><i class="far fa-hospital"></i></div>
              <div class="list-info">
                <h4>${h.name}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${h.location}</p>
              </div>
              <button class="btn btn-primary btn-small" style="width: auto;">Book</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `,

  BookingPurposeView: (purposes) => `
    <div class="app-container fade-in">
      <div class="header" style="border-radius: 0; padding-bottom: 1rem;">
        <div class="d-flex align-center gap-2">
          <button class="btn btn-outline btn-small" style="color: white; border-color: rgba(255,255,255,0.3);" onclick="App.navigate('booking_hospital')">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h2 class="header-title" style="margin: 0; font-size: 1.25rem;">Purpose of Visit</h2>
        </div>
      </div>
      <div class="p-4 pt-3">
        ${Components.Stepper(2)}
        <div class="selection-list">
          ${purposes.map(p => `
            <div class="list-card" onclick="App.selectPurpose('${p.id}')" id="purpose-${p.id}">
              <div class="list-icon" style="background: rgba(20, 184, 166, 0.1); color: var(--secondary);"><i class="fas ${p.icon}"></i></div>
              <div class="list-info">
                <h4>${p.name}</h4>
              </div>
              <i class="fas fa-check-circle list-check"></i>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary mt-2" onclick="App.navigate('booking_slot')">Continue</button>
      </div>
    </div>
  `,

  BookingSlotView: (dates = [], slots = [], selectedDate = '', selectedTime = '') => {
    const currentMonthYear = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    return `
    <div class="app-container fade-in">
      <div class="header" style="border-radius: 0; padding-bottom: 1rem;">
        <div class="d-flex align-center gap-2">
          <button class="btn btn-outline btn-small" style="color: white; border-color: rgba(255,255,255,0.3);" onclick="App.navigate('booking_purpose')">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h2 class="header-title" style="margin: 0; font-size: 1.25rem;">Select Slot</h2>
        </div>
      </div>
      <div class="p-4 pt-3">
        ${Components.Stepper(3)}
        
        <h3 class="mb-2" style="font-size: 1rem;">Select Date</h3>
        <div class="card mb-4">
          <div class="calendar-header">
            <span class="font-semibold">${currentMonthYear}</span>
            <div><i class="fas fa-chevron-left me-2 text-muted"></i><i class="fas fa-chevron-right text-primary ms-2"></i></div>
          </div>
          <div class="calendar-grid" style="grid-template-columns: repeat(7, 1fr); gap: 0.5rem; text-align: center; margin-top: 1rem; border: none; padding: 0;">
            ${dates.map(d => `
              <div class="calendar-day ${d.label === selectedDate ? 'active' : ''}" 
                   onclick="App.selectDate(this, '${d.label}')"
                   style="display: flex; flex-direction: column; padding: 0.5rem; border-radius: var(--radius); cursor: pointer; border: 1px solid var(--border);">
                <span style="font-size: 0.7rem; color: var(--text-muted); pointer-events: none;">${d.dayName}</span>
                <span style="font-weight: 600; margin-top: 0.2rem; pointer-events: none;">${d.day}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <h3 class="mb-2" style="font-size: 1rem;">Select Time</h3>
        <div class="time-slots mb-4">
          ${slots.map(s => `
            <div class="time-slot ${s.disabled ? 'disabled' : ''} ${s.time === selectedTime ? 'active' : ''}" 
                 onclick="App.selectTime(this, '${s.time}')">
              ${s.time}
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary" onclick="App.navigate('booking_confirm')">Review Appointment</button>
      </div>
    </div>
  `},

  BookingConfirmView: (hospital, purpose, date, time) => `
    <div class="app-container fade-in">
      <div class="header" style="border-radius: 0; padding-bottom: 1rem;">
        <div class="d-flex align-center gap-2">
          <button class="btn btn-outline btn-small" style="color: white; border-color: rgba(255,255,255,0.3);" onclick="App.navigate('booking_slot')">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h2 class="header-title" style="margin: 0; font-size: 1.25rem;">Confirm Booking</h2>
        </div>
      </div>
      <div class="p-4 pt-3">
        ${Components.Stepper(4)}
        
        <div class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Hospital</span>
            <span class="summary-value">${hospital ? hospital.name : ''}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Purpose</span>
            <span class="summary-value">${purpose ? purpose.name : ''}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Date</span>
            <span class="summary-value">${date}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Time</span>
            <span class="summary-value">${time}</span>
          </div>
        </div>
        
        <div class="d-flex gap-2">
          <button class="btn btn-outline" onclick="App.navigate('booking_slot')">Cancel</button>
          <button class="btn btn-primary" onclick="App.confirmBooking()">Confirm Appointment</button>
        </div>
      </div>
    </div>
  `,

  HistoryView: (appointments) => `
    <div class="app-container fade-in">
      <div class="header">
        <h2 class="header-title">My Appointments</h2>
      </div>
      <div class="p-4">
        ${appointments.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-history"></i></div>
            <h3>No History</h3>
            <p>You haven't booked any appointments yet.</p>
          </div>
        ` : appointments.map(appt => `
          <div class="card mb-3">
            <div class="d-flex justify-between align-center mb-2">
              <span class="font-bold text-primary">Token #${appt.token}</span>
              <span class="badge badge-${appt.status}">${appt.status.toUpperCase()}</span>
            </div>
            <h4 class="mb-1">${appt.hospitalName}</h4>
            <p class="text-muted mb-2" style="font-size: 0.8rem;">${appt.purposeName}</p>
            <p class="text-muted" style="font-size: 0.875rem;">
              <i class="far fa-calendar-alt me-1"></i> ${appt.date} at ${appt.time}
            </p>
          </div>
        `).join('')}
      </div>
      ${Components.BottomNav('history')}
    </div>
  `,

  AdminDashboard: (stats, hospitals, currentHospitalId, queueStats, appointments) => {
    // Generate purpose stats html
    let purposeHtml = '';
    for (let p in stats.purposeStats) {
      purposeHtml += `<div class="d-flex justify-between text-muted" style="font-size:0.875rem; margin-bottom:0.25rem;"><span>${p}</span> <span class="font-bold text-main">${stats.purposeStats[p]}</span></div>`;
    }

    return `
    <div class="app-container fade-in">
      <div class="header">
        <div class="d-flex justify-between align-center">
          <div>
            <h2 class="header-title">Admin Panel</h2>
            <p class="header-subtitle">Manage Queue & Appointments</p>
          </div>
          <button class="btn btn-outline btn-small" style="color:white; border-color:white; width:auto;" onclick="App.logout()">Logout</button>
        </div>
      </div>
      
      <div class="p-4 pt-0">
        <h3 class="mb-2" style="font-size: 1rem;">Filter by Hospital</h3>
        <div class="input-group mb-4">
          <select class="input-control" onchange="App.adminSelectHospital(this.value)">
            ${hospitals.map(h => `<option value="${h.id}" ${h.id === currentHospitalId ? 'selected' : ''}>${h.name}</option>`).join('')}
          </select>
        </div>

        <div class="queue-stats mb-4">
          <div class="stat-box">
            <div class="stat-box-value">${stats.total}</div>
            <div class="stat-box-label">Total Appts</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value" style="color: var(--secondary);">${Object.keys(stats.dailyBookings).length ? stats.dailyBookings['April 28'] || 0 : 0}</div>
            <div class="stat-box-label">Today's Bookings</div>
          </div>
        </div>

        <div class="card mb-4">
          <h4 class="mb-2" style="font-size: 0.9rem;">Purpose Statistics</h4>
          ${purposeHtml || '<p class="text-muted" style="font-size:0.875rem;">No data yet</p>'}
        </div>

        <div class="card mb-4 text-center" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white;">
          <h3 class="mb-2 text-white" style="opacity:0.9; font-size:1rem;">Current Running Token</h3>
          <div style="font-size: 4rem; font-weight: 800; line-height: 1; margin-bottom: 1rem;">#${queueStats.currentToken}</div>
          <button class="btn" style="background: white; color: var(--primary);" onclick="App.adminNextToken()">
            <i class="fas fa-bullhorn"></i> Call Next Token
          </button>
        </div>

        <h3 class="mb-3">Appointments for Selected Hospital</h3>
        <div class="card">
          ${appointments.length === 0 ? `<p class="text-center text-muted py-3">No appointments found</p>` : 
            appointments.map(appt => `
            <div class="list-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem;">
              <div class="w-100 d-flex justify-between align-center">
                <h4><span class="text-primary font-bold">#${appt.token}</span> - ${appt.userName}</h4>
                <span class="badge badge-${appt.status}">${appt.status.toUpperCase()}</span>
              </div>
              <p class="text-muted" style="font-size: 0.8rem;">${appt.purposeName} | ${appt.date} - ${appt.time}</p>
              ${appt.status === 'pending' || appt.status === 'approved' ? `
                <div class="admin-actions mt-1 w-100 justify-between">
                  <button class="btn btn-outline btn-small text-danger" style="border-color: #dc2626;" onclick="App.adminUpdateStatus(${appt.id}, 'cancelled')"><i class="fas fa-times"></i> Reject</button>
                  <button class="btn btn-primary btn-small" onclick="App.adminUpdateStatus(${appt.id}, 'completed')"><i class="fas fa-check"></i> Mark Done</button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `},

  BottomNav: (activeTab) => `
    <div class="bottom-nav">
      <button class="nav-item ${activeTab === 'home' ? 'active' : ''}" onclick="App.navigate('home')">
        <i class="fas fa-home"></i>
        <span>Home</span>
      </button>
      <button class="nav-item ${activeTab === 'history' ? 'active' : ''}" onclick="App.navigate('history')">
        <i class="fas fa-history"></i>
        <span>History</span>
      </button>
      <button class="nav-item" onclick="App.logout()">
        <i class="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </button>
    </div>
  `
};
