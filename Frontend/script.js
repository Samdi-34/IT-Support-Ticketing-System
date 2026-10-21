const API_URL = 'http://localhost:5010/api';

const ticketForm = document.getElementById('ticketForm');
const ticketList = document.getElementById('ticketList');
const formMessage = document.getElementById('formMessage');
const ticketMessage = document.getElementById('ticketMessage');
const refreshButton = document.getElementById('refreshButton');


// Load all tickets
async function loadTickets() {
  ticketList.textContent = 'Loading tickets...';
  ticketMessage.textContent = '';

  try {
    const response = await fetch(`${API_URL}/tickets`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load tickets');
    }

    displayTickets(result.data);

  } catch (error) {
    ticketList.textContent = '';
    ticketMessage.textContent = `Error: ${error.message}`;
  }
}


// Display tickets on the page
function displayTickets(tickets) {
  if (tickets.length === 0) {
    ticketList.textContent = 'No tickets found.';
    return;
  }

  ticketList.innerHTML = '';

  tickets.forEach(ticket => {
    const ticketElement = document.createElement('div');
    ticketElement.className = 'ticket';

    ticketElement.innerHTML = `
      <h3>${escapeHtml(ticket.title)}</h3>
      <p><strong>Ticket ID:</strong> ${ticket.ticket_id}</p>
      <p><strong>Requester:</strong> ${escapeHtml(ticket.requester_name)}</p>
      <p><strong>Category:</strong> ${escapeHtml(ticket.category)}</p>
      <p><strong>Priority:</strong> ${escapeHtml(ticket.priority)}</p>
      <p><strong>Description:</strong> ${escapeHtml(ticket.description)}</p>
      <p><strong>Status:</strong>
        <span class="status">${escapeHtml(ticket.status)}</span>
      </p>
    `;

    ticketList.appendChild(ticketElement);
  });
}


// Submit a new ticket
ticketForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  formMessage.textContent = 'Submitting ticket...';

  const ticketData = {
    requester_id: Number(document.getElementById('requester_id').value),
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    category: document.getElementById('category').value,
    priority: document.getElementById('priority').value
  };

  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create ticket');
    }

    formMessage.textContent =
      `Ticket created successfully. Ticket ID: ${result.ticket_id}`;

    ticketForm.reset();

    document.getElementById('priority').value = 'medium';

    loadTickets();

  } catch (error) {
    formMessage.textContent = `Error: ${error.message}`;
  }
});


// Refresh button
refreshButton.addEventListener('click', loadTickets);


// Basic protection when displaying database values
function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// Load tickets when page opens
loadTickets();