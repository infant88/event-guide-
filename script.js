// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// State Management
let allEvents = [];
let filteredEvents = [];
let currentCategory = 'all';
let selectedEventId = null;

// DOM Elements
const eventsGrid = document.getElementById('eventsGrid');
const loading = document.getElementById('loading');
const noEvents = document.getElementById('noEvents');
const addEventModal = document.getElementById('addEventModal');
const eventDetailsModal = document.getElementById('eventDetailsModal');
const eventForm = document.getElementById('eventForm');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sortBy = document.getElementById('sortBy');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadEvents();
});

// Event Listeners
function initializeEventListeners() {
  // Add Event Modal
  document.getElementById('addEventBtn').addEventListener('click', openAddEventModal);
  document.getElementById('closeModal').addEventListener('click', closeAddEventModal);
  document.getElementById('modalOverlay').addEventListener('click', closeAddEventModal);
  document.getElementById('cancelBtn').addEventListener('click', closeAddEventModal);
  
  // Event Details Modal
  document.getElementById('closeDetailsModal').addEventListener('click', closeEventDetailsModal);
  document.getElementById('detailsOverlay').addEventListener('click', closeEventDetailsModal);
  
  // Form Submit
  eventForm.addEventListener('submit', handleEventSubmit);
  
  // Search
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  
  // Sort
  sortBy.addEventListener('change', handleSort);
  
  // Category Filters
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', () => handleCategoryFilter(card));
  });
}

// API Functions
async function loadEvents() {
  try {
    showLoading(true);
    const response = await fetch(`${API_BASE_URL}/events`);
    const data = await response.json();
    
    if (data.success) {
      allEvents = data.data;
      filteredEvents = allEvents;
      renderEvents(filteredEvents);
    } else {
      showError('Failed to load events');
    }
  } catch (error) {
    console.error('Error loading events:', error);
    showError('Failed to connect to server. Make sure the backend is running.');
  } finally {
    showLoading(false);
  }
}

async function createEvent(eventData) {
  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('Event created successfully!');
      closeAddEventModal();
      loadEvents();
    } else {
      showError(data.message || 'Failed to create event');
    }
  } catch (error) {
    console.error('Error creating event:', error);
    showError('Failed to create event');
  }
}

async function loadEventDetails(eventId) {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
    const data = await response.json();
    
    if (data.success) {
      displayEventDetails(data.data);
    } else {
      showError('Failed to load event details');
    }
  } catch (error) {
    console.error('Error loading event details:', error);
    showError('Failed to load event details');
  }
}

async function rsvpToEvent(eventId, name, email) {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('RSVP successful! See you at the event!');
      closeEventDetailsModal();
    } else {
      showError(data.message || 'Failed to RSVP');
    }
  } catch (error) {
    console.error('Error RSVP:', error);
    showError('Failed to RSVP');
  }
}

async function deleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('Event deleted successfully');
      closeEventDetailsModal();
      loadEvents();
    } else {
      showError(data.message || 'Failed to delete event');
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    showError('Failed to delete event');
  }
}

// Render Functions
function renderEvents(events) {
  eventsGrid.innerHTML = '';
  
  if (events.length === 0) {
    noEvents.classList.remove('hidden');
    return;
  }
  
  noEvents.classList.add('hidden');
  
  events.forEach(event => {
    const eventCard = createEventCard(event);
    eventsGrid.appendChild(eventCard);
  });
}

function createEventCard(event) {
  const card = document.createElement('div');
  card.className = 'event-card';
  
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  card.innerHTML = `
    <img src="${event.imageUrl || 'https://via.placeholder.com/400x300?text=Event+Image'}" 
         alt="${event.title}" 
         class="event-image">
    <div class="event-content">
      <span class="event-badge">${event.category}</span>
      <h3 class="event-title">${event.title}</h3>
      <p class="event-description">${event.description}</p>
      <div class="event-meta">
        <div><i class="fas fa-calendar"></i> ${formattedDate}</div>
        <div><i class="fas fa-clock"></i> ${event.time}</div>
        <div><i class="fas fa-map-marker-alt"></i> ${event.location}</div>
      </div>
      <div class="event-actions">
        <button class="btn btn--primary btn--sm" onclick="openEventDetails('${event._id}')">
          <i class="fas fa-info-circle"></i> View Details
        </button>
      </div>
    </div>
  `;
  
  return card;
}

function displayEventDetails(event) {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const detailsContent = document.getElementById('eventDetailsContent');
  detailsContent.innerHTML = `
    <img src="${event.imageUrl || 'https://via.placeholder.com/800x400?text=Event+Image'}" 
         alt="${event.title}" 
         class="event-details-image">
    
    <div class="event-details-info">
      <h2>${event.title}</h2>
      <span class="event-badge">${event.category}</span>
      
      <div class="event-details-row">
        <i class="fas fa-align-left"></i>
        <div class="event-details-text">
          <div class="event-details-label">Description</div>
          <div class="event-details-value">${event.description}</div>
        </div>
      </div>
      
      <div class="event-details-row">
        <i class="fas fa-calendar"></i>
        <div class="event-details-text">
          <div class="event-details-label">Date & Time</div>
          <div class="event-details-value">${formattedDate} at ${event.time}</div>
        </div>
      </div>
      
      <div class="event-details-row">
        <i class="fas fa-map-marker-alt"></i>
        <div class="event-details-text">
          <div class="event-details-label">Location</div>
          <div class="event-details-value">${event.location}</div>
        </div>
      </div>
      
      <div class="event-details-row">
        <i class="fas fa-user"></i>
        <div class="event-details-text">
          <div class="event-details-label">Organizer</div>
          <div class="event-details-value">${event.organizer}</div>
        </div>
      </div>
      
      <div class="event-details-row">
        <i class="fas fa-envelope"></i>
        <div class="event-details-text">
          <div class="event-details-label">Contact Email</div>
          <div class="event-details-value">${event.contactEmail}</div>
        </div>
      </div>
      
      ${event.contactPhone ? `
        <div class="event-details-row">
          <i class="fas fa-phone"></i>
          <div class="event-details-text">
            <div class="event-details-label">Contact Phone</div>
            <div class="event-details-value">${event.contactPhone}</div>
          </div>
        </div>
      ` : ''}
      
      ${event.attendees && event.attendees.length > 0 ? `
        <div class="event-details-row">
          <i class="fas fa-users"></i>
          <div class="event-details-text">
            <div class="event-details-label">Attendees</div>
            <div class="event-details-value">${event.attendees.length} people are attending</div>
          </div>
        </div>
      ` : ''}
    </div>
    
    <div class="rsvp-form">
      <h4><i class="fas fa-ticket-alt"></i> RSVP to this Event</h4>
      <form id="rsvpForm" onsubmit="handleRSVP(event, '${event._id}')">
        <div class="form-group">
          <label for="rsvpName" class="form-label">Your Name</label>
          <input type="text" id="rsvpName" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="rsvpEmail" class="form-label">Your Email</label>
          <input type="email" id="rsvpEmail" class="form-control" required>
        </div>
        <button type="submit" class="btn btn--primary">
          <i class="fas fa-check"></i> Confirm RSVP
        </button>
      </form>
    </div>
    
    <div class="form-actions">
      <button class="btn btn--outline" onclick="deleteEvent('${event._id}')">
        <i class="fas fa-trash"></i> Delete Event
      </button>
    </div>
  `;
  
  eventDetailsModal.classList.remove('hidden');
}

// Event Handlers
function handleEventSubmit(e) {
  e.preventDefault();
  
  const eventData = {
    title: document.getElementById('eventTitle').value,
    description: document.getElementById('eventDescription').value,
    date: document.getElementById('eventDate').value,
    time: document.getElementById('eventTime').value,
    location: document.getElementById('eventLocation').value,
    category: document.getElementById('eventCategory').value,
    organizer: document.getElementById('eventOrganizer').value,
    contactEmail: document.getElementById('eventEmail').value,
    contactPhone: document.getElementById('eventPhone').value,
    imageUrl: document.getElementById('eventImage').value,
    isFree: true
  };
  
  createEvent(eventData);
}

function handleRSVP(e, eventId) {
  e.preventDefault();
  
  const name = document.getElementById('rsvpName').value;
  const email = document.getElementById('rsvpEmail').value;
  
  rsvpToEvent(eventId, name, email);
}

function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();
  
  if (!query) {
    filteredEvents = allEvents;
    renderEvents(filteredEvents);
    return;
  }
  
  filteredEvents = allEvents.filter(event => 
    event.title.toLowerCase().includes(query) ||
    event.description.toLowerCase().includes(query) ||
    event.location.toLowerCase().includes(query) ||
    event.category.toLowerCase().includes(query)
  );
  
  renderEvents(filteredEvents);
}

function handleCategoryFilter(card) {
  // Update active state
  document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  
  const category = card.dataset.category;
  currentCategory = category;
  
  if (category === 'all') {
    filteredEvents = allEvents;
  } else {
    filteredEvents = allEvents.filter(event => event.category === category);
  }
  
  renderEvents(filteredEvents);
}

function handleSort() {
  const sortValue = sortBy.value;
  
  let sorted = [...filteredEvents];
  
  switch(sortValue) {
    case 'date':
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'category':
      sorted.sort((a, b) => a.category.localeCompare(b.category));
      break;
  }
  
  filteredEvents = sorted;
  renderEvents(filteredEvents);
}

// Modal Functions
function openAddEventModal() {
  addEventModal.classList.remove('hidden');
  eventForm.reset();
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('eventDate').setAttribute('min', today);
  document.getElementById('eventDate').value = today;
}

function closeAddEventModal() {
  addEventModal.classList.add('hidden');
  eventForm.reset();
}

function openEventDetails(eventId) {
  selectedEventId = eventId;
  loadEventDetails(eventId);
}

function closeEventDetailsModal() {
  eventDetailsModal.classList.add('hidden');
  selectedEventId = null;
}

// Utility Functions
function showLoading(show) {
  if (show) {
    loading.classList.remove('hidden');
    eventsGrid.innerHTML = '';
  } else {
    loading.classList.add('hidden');
  }
}

function showSuccess(message) {
  alert('✅ ' + message);
}

function showError(message) {
  alert('❌ ' + message);
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAddEventModal();
    closeEventDetailsModal();
  }
});
