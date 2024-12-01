/**
 * Created by Dustin Moore | https://www.dustinmoore.dev | https://www.github.com/dustinmmoore | https://www.linkedin.com/in/dustinmmoore
 * Collaborated with Mike Moore | https://www.linkedin.com/in/mike-e-moore/
 */

class DNSRecordManager {
    constructor() {
        this.form = document.getElementById('recordForm');
        this.exportCSV = document.getElementById('exportCSV');
        this.exportJSON = document.getElementById('exportJSON');
        this.records = [];
        this.importRecords = document.getElementById('importRecords');
        
        // Add subnet validation patterns
        this.subnetPatterns = {
            'class-a': /^(255\.0\.0\.0|255\.[0-9]+\.0\.0)$/,
            'class-b': /^(255\.255\.0\.0|255\.255\.[0-9]+\.0)$/,
            'class-c': /^(255\.255\.255\.0|255\.255\.255\.[0-9]+)$/
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecord();
        });

        this.exportCSV.addEventListener('click', () => this.exportToCSV());
        this.exportJSON.addEventListener('click', () => this.exportToJSON());
        this.importRecords.addEventListener('click', () => this.handleBulkImport());
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
        const recordType = document.getElementById('recordType').value;
        const subnet = document.getElementById('subnet').value;

        if (recordType === 'CNAME') {
            return this.validateCNAME(hostname, ipAddress);
        }

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
        if (subnet && !this.validateSubnet(subnet)) {
            this.showError('Invalid subnet mask');
            return false;
        }
        return true;
    }

    validateSubnet(subnet) {
        return Object.values(this.subnetPatterns).some(pattern => pattern.test(subnet));
    }

    validateCNAME(hostname, target) {
        const hostnamePattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!hostnamePattern.test(target)) {
            this.showError('Invalid CNAME target');
            return false;
        }
        return true;
    }

    generatePTRRecord(ipAddress) {
        const reversedIP = ipAddress.split('.')
            .reverse()
            .join('.');
        return `${reversedIP}.in-addr.arpa`;
    }

    handleBulkImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    if (file.name.endsWith('.csv')) {
                        this.importCSV(event.target.result);
                    } else {
                        this.importJSON(event.target.result);
                    }
                } catch (error) {
                    this.showError('Import failed: Invalid file format');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    importCSV(content) {
        const rows = content.split('\n').slice(1); // Skip header
        rows.forEach(row => {
            const [type, hostname, target, ttl] = row.split(',');
            if (hostname && target && ttl) {
                this.records.push({ type, hostname, target, ttl });
                this.updateTable();
            }
        });
    }

    updateTable() {
        const tbody = document.querySelector('#recordsTable tbody');
        const row = tbody.insertRow();
        const record = this.records[this.records.length - 1];
        
        // Add Type column
        const typeCell = row.insertCell();
        typeCell.textContent = record.type || 'A';

        // Add other columns
        Object.values(record).forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value;
        });

        // Add PTR record if it's an A record
        const ptrCell = row.insertCell();
        if (record.type === 'A') {
            ptrCell.textContent = this.generatePTRRecord(record.ipAddress);
        } else {
            ptrCell.textContent = 'N/A';
        }
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