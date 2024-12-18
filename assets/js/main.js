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
        
        this.recordTypeSelect = document.getElementById('recordType');
        this.ipAddressGroup = document.getElementById('ipAddressGroup');
        this.aliasGroup = document.getElementById('aliasGroup');
        this.canonicalGroup = document.getElementById('canonicalGroup');
        this.hostnameGroup = document.getElementById('hostnameGroup');

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
        this.recordTypeSelect.addEventListener('change', () => this.toggleRecordTypeFields());
    }

    toggleRecordTypeFields() {
        const isCNAME = this.recordTypeSelect.value === 'CNAME';
        this.ipAddressGroup.style.display = isCNAME ? 'none' : 'block';
        this.hostnameGroup.style.display = isCNAME ? 'none' : 'block';
        this.aliasGroup.style.display = isCNAME ? 'block' : 'none';
        this.canonicalGroup.style.display = isCNAME ? 'block' : 'none';
        
        // Toggle required attribute
        document.getElementById('hostname').required = !isCNAME;
        document.getElementById('ipAddress').required = !isCNAME;
        document.getElementById('alias').required = isCNAME;
        document.getElementById('canonical').required = isCNAME;
    }

    addRecord() {
        const recordType = this.recordTypeSelect.value;
        
        if (recordType === 'A') {
            const hostname = document.getElementById('hostname').value.trim();
            const ipAddress = document.getElementById('ipAddress').value.trim();
            const ttl = document.getElementById('ttl').value.trim();

            if (!this.validateInputs(hostname, ipAddress, ttl)) return;

            this.records.push({
                type: 'A',
                hostname,
                target: ipAddress,
                ttl
            });
        } else if (recordType === 'CNAME') {
            const alias = document.getElementById('alias').value.trim();
            const canonical = document.getElementById('canonical').value.trim();
            const ttl = document.getElementById('ttl').value.trim();

            if (!this.validateCNAME(alias, canonical)) return;

            this.records.push({
                type: 'CNAME',
                hostname: alias,
                target: canonical,
                ttl
            });
        }

        this.updateTable();
        this.clearForm();
    }

    validateInputs(hostname, ipAddress, ttl) {
        const recordType = this.recordTypeSelect.value;

        if (recordType === 'CNAME') {
            const alias = document.getElementById('alias').value.trim();
            const canonical = document.getElementById('canonical').value.trim();
            return this.validateCNAME(alias, canonical);
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
        return true;
    }

    validateCNAME(alias, canonical) {
        // Simpler pattern that just checks for at least one dot and no spaces
        const hostnamePattern = /^[^\s]+\.[^\s]+$/;
        
        if (!alias || !canonical) {
            this.showError('Please fill in all CNAME fields');
            return false;
        }

        // Debug logging
        console.log('Validating:', { alias, canonical });
        console.log('Alias test:', hostnamePattern.test(alias));
        console.log('Canonical test:', hostnamePattern.test(canonical));

        if (!hostnamePattern.test(canonical) || !hostnamePattern.test(alias)) {
            this.showError('Invalid domain format. Domain must contain at least one dot (example: example.com)');
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
        const record = this.records[this.records.length - 1];
        const row = tbody.insertRow();
        row.setAttribute('data-type', record.type);

        // Add cells
        const cells = [
            record.type,
            record.hostname,
            record.target,
            record.ttl,
            record.type === 'A' ? this.generatePTRRecord(record.target) : 'N/A'
        ];

        cells.forEach(content => {
            const cell = row.insertCell();
            cell.textContent = content;
        });
    }

    exportToCSV() {
        if (this.records.length === 0) {
            this.showError('No records to export');
            return;
        }

        const headers = ['Type', 'Hostname', 'Target', 'TTL'];
        const csvContent = [
            headers.join(','),
            ...this.records.map(record => 
                [record.type, record.hostname, record.target, record.ttl].join(',')
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

document.addEventListener('DOMContentLoaded', function() {
    const recordType = document.getElementById('recordType');
    const hostnameGroup = document.getElementById('hostnameGroup');
    const ipAddressGroup = document.getElementById('ipAddressGroup');
    const aliasGroup = document.getElementById('aliasGroup');
    const canonicalGroup = document.getElementById('canonicalGroup');

    recordType.addEventListener('change', function() {
        if (this.value === 'A') {
            hostnameGroup.style.display = 'block';
            ipAddressGroup.style.display = 'block';
            aliasGroup.style.display = 'none';
            canonicalGroup.style.display = 'none';
        } else if (this.value === 'CNAME') {
            hostnameGroup.style.display = 'none';
            ipAddressGroup.style.display = 'none';
            aliasGroup.style.display = 'block';
            canonicalGroup.style.display = 'block';
        }
    });
});