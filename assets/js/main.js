
class ARecordManager {
    constructor() {
        this.form = document.getElementById('recordForm');
        this.table = document.getElementById('recordsTable').getElementsByTagName('tbody')[0];
        this.records = JSON.parse(localStorage.getItem('arecords')) || [];
        
        this.initializeEventListeners();
        this.loadStoredRecords();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }

    validateIPAddress(ipAddress) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ipAddress);
    }

    handleFormSubmit() {
        const hostname = document.getElementById('hostname').value.trim();
        const ipAddress = document.getElementById('ipAddress').value.trim();
        const ttl = document.getElementById('ttl').value;

        if (!this.validateIPAddress(ipAddress)) {
            alert('Please enter a valid IP address');
            return;
        }

        this.addRecord({
            hostname,
            ipAddress,
            ttl: parseInt(ttl)
        });

        this.form.reset();
        document.getElementById('ttl').value = '3600';
    }

    addRecord(record) {
        this.records.push(record);
        this.saveRecords();
        this.displayRecord(record);
    }

    displayRecord(record) {
        const row = this.table.insertRow();
        Object.values(record).forEach(text => {
            const cell = row.insertCell();
            cell.textContent = text;
        });
    }

    loadStoredRecords() {
        this.records.forEach(record => this.displayRecord(record));
    }

    saveRecords() {
        localStorage.setItem('arecords', JSON.stringify(this.records));
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ARecordManager();
});