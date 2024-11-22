/**
 * A Record Creator - Production Version
 * @author Dustin Moore (https://www.dustinmoore.dev)
 * @collaborator Mike Moore (https://www.linkedin.com/in/mike-e-moore/)
 */

const DEFAULT_TTL = '3600';
const IP_PATTERN = /^((25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
const STORAGE_KEY = 'dnsRecords';

// Sanitize input to prevent XSS
function sanitizeInput(input) {
    return input.replace(/[<>]/g, '');
}

function showError(message) {
    const errorElement = document.getElementById('errorBoundary');
    errorElement.textContent = message;
    errorElement.hidden = false;
    setTimeout(() => errorElement.hidden = true, 5000);
}

function setLoading(isLoading) {
    const button = document.getElementById('submitButton');
    const spinner = button.querySelector('.loading-spinner');
    const text = button.querySelector('.button-text');
    button.disabled = isLoading;
    spinner.hidden = !isLoading;
    text.hidden = isLoading;
}

function saveRecords(records) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
        console.error('Error saving records:', error);
        showError('Unable to save records');
    }
}

function loadRecords() {
    try {
        const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const recordsBody = document.getElementById('recordsBody');
        recordsBody.innerHTML = '';
        records.forEach(record => {
            const row = recordsBody.insertRow();
            Object.values(record).forEach(value => {
                row.insertCell().textContent = value;
            });
        });
    } catch (error) {
        console.error('Error loading records:', error);
        showError('Unable to load records');
    }
}

function validateInputs(hostname, ipAddress, ttl) {
    if (!hostname || !ipAddress || !ttl) {
        throw new Error('Please fill in all fields.');
    }
    if (!IP_PATTERN.test(ipAddress)) {
        throw new Error('Please enter a valid IP address.');
    }
    if (isNaN(ttl) || parseInt(ttl) < 0) {
        throw new Error('Please enter a valid TTL value.');
    }
}

function clearInputs() {
    document.getElementById('hostname').value = '';
    document.getElementById('ipAddress').value = '';
    document.getElementById('ttl').value = DEFAULT_TTL;
}

async function addRecord() {
    try {
        setLoading(true);
        const hostname = sanitizeInput(document.getElementById('hostname').value.trim());
        const ipAddress = sanitizeInput(document.getElementById('ipAddress').value.trim());
        const ttl = sanitizeInput(document.getElementById('ttl').value.trim());

        validateInputs(hostname, ipAddress, ttl);

        const record = { hostname, ipAddress, ttl };
        const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        records.push(record);
        saveRecords(records);
        loadRecords();
        clearInputs();
    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadRecords();
});

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showError('An unexpected error occurred');
});