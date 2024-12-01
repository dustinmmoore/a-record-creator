class DNSRecordManager {
    constructor() {
        this.form = document.getElementById('recordForm');
        this.exportCSV = document.getElementById('exportCSV');
        this.exportJSON = document.getElementById('exportJSON');
        this.records = [];

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecord();
        });

        this.exportCSV.addEventListener('click', () => this.exportToCSV());
        this.exportJSON.addEventListener('click', () => this.exportToJSON());
    }

    addRecord() {
        const hostname = document.getElementById('hostname').value.trim();
        const ipAddress = document.getElementById('ipAddress').value.trim();
        const ttl = document.getElementById('ttl').value.trim();

        if (!this.validateInputs(hostname, ipAddress, ttl)) return;

        this.records.push({ hostname, ipAddress, ttl });
        this.updateTable();
        this.clearForm();
    }

    validateInputs(hostname, ipAddress, ttl) {
        const ipPattern = /^((25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
        
        if (!hostname || !ipAddress || !ttl) {
            this.showError('Please fill in all fields');
            return false;
        }
        if (!ipPattern.test(ipAddress)) {
            this.showError('Please enter a valid IP address');
            return false;
        }
        if (isNaN(ttl) || parseInt(ttl) < 0) {
            this.showError('Please enter a valid TTL value');
            return false;
        }
        return true;
    }

    updateTable() {
        const tbody = document.querySelector('#recordsTable tbody');
        const row = tbody.insertRow();
        const record = this.records[this.records.length - 1];
        
        Object.values(record).forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value;
        });
    }

    exportToCSV() {
        if (this.records.length === 0) {
            this.showError('No records to export');
            return;
        }

        const headers = ['Hostname', 'IP Address', 'TTL'];
        const csvContent = [
            headers.join(','),
            ...this.records.map(record => 
                [record.hostname, record.ipAddress, record.ttl].join(',')
            )
        ].join('\n');

        this.downloadFile(csvContent, 'dns_records.csv', 'text/csv');
    }

    exportToJSON() {
        if (this.records.length === 0) {
            this.showError('No records to export');
            return;
        }

        const jsonContent = JSON.stringify(this.records, null, 2);
        this.downloadFile(jsonContent, 'dns_records.json', 'application/json');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    clearForm() {
        this.form.reset();
        document.getElementById('ttl').value = '3600';
    }

    showError(message) {
        const errorElement = document.getElementById('errorBoundary');
        errorElement.textContent = message;
        errorElement.hidden = false;
        setTimeout(() => errorElement.hidden = true, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DNSRecordManager();
});