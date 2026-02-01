import type { User, Rule, Notification, DashboardStats, Review, Transaction, ChartData } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'security_analyst',
    email: 'analyst@example.com',
    profile: {
      firstName: 'Sarah',
      lastName: 'Connor',
      bio: 'Senior Security Analyst | Threat Hunter | MITRE ATT&CK Enthusiast',
      location: 'San Francisco, CA',
      website: 'https://sarahconnor.io',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    },
    role: 'USER',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-20T14:30:00Z',
  },
  {
    id: '2',
    username: 'threat_hunter',
    email: 'hunter@example.com',
    profile: {
      firstName: 'John',
      lastName: 'Matrix',
      bio: 'Red Team Lead | Detection Engineering | Open Source Contributor',
      location: 'Austin, TX',
      website: 'https://threatmatrix.io',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    },
    role: 'MODERATOR',
    status: 'active',
    createdAt: '2023-11-20T08:00:00Z',
    updatedAt: '2024-03-18T16:45:00Z',
  },
];

// Mock Rules
export const mockRules: Rule[] = [
  {
    id: 'rule-001',
    title: 'Suspicious PowerShell Execution',
    description: 'Detects suspicious PowerShell command line patterns commonly used by attackers for reconnaissance and execution.',
    content: `title: Suspicious PowerShell Execution
status: production
description: |
  Detects suspicious PowerShell command line patterns commonly used by attackers
  for reconnaissance and execution.
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains:
      - '-enc'
      - '-EncodedCommand'
      - 'IEX'
      - 'Invoke-Expression'
      - 'downloadstring'
  condition: selection
falsepositives:
  - Administrative scripts
  - Legitimate automation tools
level: high`,
    author: mockUsers[0],
    status: 'published',
    visibility: 'public',
    version: '1.2.0',
    versions: [
      { version: '1.2.0', content: '...', changelog: 'Added new detection patterns', author: 'security_analyst', createdAt: '2024-03-15T10:00:00Z' },
      { version: '1.1.0', content: '...', changelog: 'Improved false positive handling', author: 'security_analyst', createdAt: '2024-02-28T14:00:00Z' },
      { version: '1.0.0', content: '...', changelog: 'Initial release', author: 'security_analyst', createdAt: '2024-01-20T09:00:00Z' },
    ],
    mitre: [
      { tactic: 'execution', techniqueId: 'T1059', techniqueName: 'Command and Scripting Interpreter', subtechniqueId: 'T1059.001', subtechniqueName: 'PowerShell' },
      { tactic: 'defense-evasion', techniqueId: 'T1027', techniqueName: 'Obfuscated Files or Information' },
    ],
    tags: ['powershell', 'sigma', 'windows', 'endpoint'],
    platform: ['Windows'],
    severity: 'high',
    falsePositiveRate: 'medium',
    dataSource: ['Process Creation', 'Command Line Logging'],
    references: ['https://attack.mitre.org/techniques/T1059/001/'],
    downloads: 2547,
    likes: 189,
    forks: 45,
    rating: 4.7,
    reviewCount: 32,
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'rule-002',
    title: 'Lateral Movement via WMI',
    description: 'Detects potential lateral movement using Windows Management Instrumentation (WMI) to execute commands on remote systems.',
    content: `title: Lateral Movement via WMI
status: production
description: |
  Detects potential lateral movement using WMI to execute commands remotely.
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\wmic.exe'
    CommandLine|contains:
      - '/node:'
      - 'process call create'
  condition: selection
level: high`,
    author: mockUsers[1],
    status: 'published',
    visibility: 'public',
    version: '2.0.1',
    versions: [
      { version: '2.0.1', content: '...', changelog: 'Bug fix for false positives', author: 'threat_hunter', createdAt: '2024-03-10T11:00:00Z' },
      { version: '2.0.0', content: '...', changelog: 'Major refactor', author: 'threat_hunter', createdAt: '2024-02-15T08:00:00Z' },
    ],
    mitre: [
      { tactic: 'lateral-movement', techniqueId: 'T1021', techniqueName: 'Remote Services', subtechniqueId: 'T1021.003', subtechniqueName: 'DCOM' },
      { tactic: 'execution', techniqueId: 'T1047', techniqueName: 'Windows Management Instrumentation' },
    ],
    tags: ['wmi', 'lateral-movement', 'sigma', 'windows'],
    platform: ['Windows'],
    severity: 'high',
    falsePositiveRate: 'low',
    dataSource: ['Process Creation', 'WMI'],
    references: ['https://attack.mitre.org/techniques/T1047/'],
    downloads: 1823,
    likes: 156,
    forks: 28,
    rating: 4.8,
    reviewCount: 24,
    createdAt: '2024-02-15T08:00:00Z',
    updatedAt: '2024-03-10T11:00:00Z',
  },
  {
    id: 'rule-003',
    title: 'Credential Dumping via Mimikatz',
    description: 'Detects usage of Mimikatz tool or similar techniques for credential theft from memory.',
    content: `title: Credential Dumping via Mimikatz
status: experimental
description: Detects Mimikatz patterns in process creation
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains:
      - 'sekurlsa::logonpasswords'
      - 'lsadump::sam'
      - 'kerberos::list'
  condition: selection
level: critical`,
    author: mockUsers[0],
    status: 'review',
    visibility: 'public',
    version: '0.9.0',
    versions: [
      { version: '0.9.0', content: '...', changelog: 'Initial submission', author: 'security_analyst', createdAt: '2024-03-18T14:00:00Z' },
    ],
    mitre: [
      { tactic: 'credential-access', techniqueId: 'T1003', techniqueName: 'OS Credential Dumping', subtechniqueId: 'T1003.001', subtechniqueName: 'LSASS Memory' },
    ],
    tags: ['mimikatz', 'credential-theft', 'sigma', 'critical'],
    platform: ['Windows'],
    severity: 'critical',
    falsePositiveRate: 'low',
    dataSource: ['Process Creation', 'Sysmon'],
    references: ['https://attack.mitre.org/techniques/T1003/001/'],
    downloads: 0,
    likes: 12,
    forks: 3,
    rating: 0,
    reviewCount: 0,
    createdAt: '2024-03-18T14:00:00Z',
    updatedAt: '2024-03-18T14:00:00Z',
  },
  {
    id: 'rule-004',
    title: 'Suspicious SSH Connection',
    description: 'Detects unusual SSH connection patterns that may indicate lateral movement or data exfiltration.',
    content: `title: Suspicious SSH Connection
status: draft
description: Monitors for unusual SSH connection patterns
logsource:
  category: network_connection
  product: linux
detection:
  selection:
    DestinationPort: 22
    Initiated: 'true'
  filter:
    DestinationIp|startswith:
      - '10.'
      - '192.168.'
  condition: selection and not filter
level: medium`,
    author: mockUsers[1],
    status: 'draft',
    visibility: 'private',
    version: '0.1.0',
    versions: [
      { version: '0.1.0', content: '...', changelog: 'Work in progress', author: 'threat_hunter', createdAt: '2024-03-19T09:00:00Z' },
    ],
    mitre: [
      { tactic: 'lateral-movement', techniqueId: 'T1021', techniqueName: 'Remote Services', subtechniqueId: 'T1021.004', subtechniqueName: 'SSH' },
      { tactic: 'exfiltration', techniqueId: 'T1048', techniqueName: 'Exfiltration Over Alternative Protocol' },
    ],
    tags: ['ssh', 'linux', 'network', 'draft'],
    platform: ['Linux', 'macOS'],
    severity: 'medium',
    falsePositiveRate: 'high',
    dataSource: ['Network Connection', 'Firewall Logs'],
    references: ['https://attack.mitre.org/techniques/T1021/004/'],
    downloads: 0,
    likes: 5,
    forks: 0,
    rating: 0,
    reviewCount: 0,
    createdAt: '2024-03-19T09:00:00Z',
    updatedAt: '2024-03-19T09:00:00Z',
  },
  {
    id: 'rule-005',
    title: 'DNS Tunneling Detection',
    description: 'Premium rule for detecting DNS tunneling techniques used for C2 communication and data exfiltration.',
    content: `title: DNS Tunneling Detection
status: production
description: |
  Advanced detection for DNS tunneling using entropy analysis
  and query pattern matching.
logsource:
  category: dns_query
  product: any
detection:
  selection:
    QueryName|contains: '.'
  filter:
    - QueryName|endswith:
        - '.local'
        - '.internal'
  condition: selection and not filter | entropy > 3.5
level: high`,
    author: mockUsers[0],
    status: 'published',
    visibility: 'paid',
    price: 49.99,
    version: '3.0.0',
    versions: [
      { version: '3.0.0', content: '...', changelog: 'Added ML-based detection', author: 'security_analyst', createdAt: '2024-03-01T10:00:00Z' },
    ],
    mitre: [
      { tactic: 'command-and-control', techniqueId: 'T1071', techniqueName: 'Application Layer Protocol', subtechniqueId: 'T1071.004', subtechniqueName: 'DNS' },
      { tactic: 'exfiltration', techniqueId: 'T1048', techniqueName: 'Exfiltration Over Alternative Protocol' },
    ],
    tags: ['dns', 'tunneling', 'c2', 'premium', 'advanced'],
    platform: ['Windows', 'Linux', 'macOS'],
    severity: 'high',
    falsePositiveRate: 'low',
    dataSource: ['DNS Logs', 'Network Traffic'],
    references: ['https://attack.mitre.org/techniques/T1071/004/'],
    downloads: 342,
    likes: 89,
    forks: 0,
    rating: 4.9,
    reviewCount: 15,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'rule_approved',
    title: 'Rule Approved',
    message: 'Your rule "Suspicious PowerShell Execution" has been approved and published.',
    read: false,
    data: { ruleId: 'rule-001' },
    createdAt: '2024-03-20T10:30:00Z',
  },
  {
    id: 'notif-002',
    type: 'new_review',
    title: 'New Review',
    message: 'threat_hunter left a 5-star review on "Lateral Movement via WMI"',
    read: false,
    data: { ruleId: 'rule-002', reviewId: 'rev-001' },
    createdAt: '2024-03-20T09:15:00Z',
  },
  {
    id: 'notif-003',
    type: 'purchase',
    title: 'New Sale',
    message: 'You sold "DNS Tunneling Detection" for $49.99',
    read: true,
    data: { ruleId: 'rule-005', amount: 49.99 },
    createdAt: '2024-03-19T16:00:00Z',
  },
  {
    id: 'notif-004',
    type: 'system',
    title: 'Platform Update',
    message: 'New MITRE ATT&CK v14 mappings are now available.',
    read: true,
    createdAt: '2024-03-18T08:00:00Z',
  },
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalRules: 1247,
  rulesChange: 12.5,
  draftRules: 156,
  reviewRules: 43,
  publishedRules: 1021,
  deprecatedRules: 27,
  totalDownloads: 45892,
  downloadsChange: 8.3,
  totalContributors: 342,
  contributorsChange: 5.2,
  totalRevenue: 12450.00,
  revenueChange: 15.7,
};

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: 'rev-001',
    ruleId: 'rule-001',
    author: mockUsers[1],
    rating: 5,
    comment: 'Excellent rule! Very comprehensive coverage of PowerShell attack patterns. Low false positives in our environment.',
    helpful: 24,
    createdAt: '2024-03-15T14:00:00Z',
    updatedAt: '2024-03-15T14:00:00Z',
  },
  {
    id: 'rev-002',
    ruleId: 'rule-001',
    author: mockUsers[0],
    rating: 4,
    comment: 'Great detection logic. Would be perfect with additional patterns for newer obfuscation techniques.',
    helpful: 12,
    createdAt: '2024-03-10T11:00:00Z',
    updatedAt: '2024-03-10T11:00:00Z',
  },
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'txn-001',
    type: 'sale',
    amount: 49.99,
    status: 'completed',
    ruleId: 'rule-005',
    ruleName: 'DNS Tunneling Detection',
    buyer: mockUsers[1],
    createdAt: '2024-03-19T16:00:00Z',
  },
  {
    id: 'txn-002',
    type: 'sale',
    amount: 49.99,
    status: 'completed',
    ruleId: 'rule-005',
    ruleName: 'DNS Tunneling Detection',
    buyer: mockUsers[0],
    createdAt: '2024-03-18T10:30:00Z',
  },
];

// Chart data
export const mockRuleStatusChart: ChartData[] = [
  { name: 'Published', value: 1021, fill: 'hsl(var(--success))' },
  { name: 'In Review', value: 43, fill: 'hsl(var(--info))' },
  { name: 'Draft', value: 156, fill: 'hsl(var(--warning))' },
  { name: 'Deprecated', value: 27, fill: 'hsl(var(--destructive))' },
];

export const mockDownloadsChart = [
  { name: 'Jan', downloads: 3240, views: 8400, value: 3240 },
  { name: 'Feb', downloads: 4100, views: 9200, value: 4100 },
  { name: 'Mar', downloads: 3800, views: 8900, value: 3800 },
  { name: 'Apr', downloads: 4500, views: 10100, value: 4500 },
  { name: 'May', downloads: 5200, views: 11500, value: 5200 },
  { name: 'Jun', downloads: 4800, views: 10800, value: 4800 },
];

export const mockTacticCoverage = [
  { name: 'Initial Access', coverage: 85, value: 85 },
  { name: 'Execution', coverage: 92, value: 92 },
  { name: 'Persistence', coverage: 78, value: 78 },
  { name: 'Privilege Escalation', coverage: 71, value: 71 },
  { name: 'Defense Evasion', coverage: 68, value: 68 },
  { name: 'Credential Access', coverage: 82, value: 82 },
  { name: 'Discovery', coverage: 75, value: 75 },
  { name: 'Lateral Movement', coverage: 88, value: 88 },
  { name: 'Collection', coverage: 62, value: 62 },
  { name: 'C&C', coverage: 79, value: 79 },
  { name: 'Exfiltration', coverage: 65, value: 65 },
  { name: 'Impact', coverage: 73, value: 73 },
];

// MITRE ATT&CK Tactics mapping
export const mitreTactics = [
  { id: 'reconnaissance', name: 'Reconnaissance', color: 'hsl(var(--tactic-reconnaissance))' },
  { id: 'resource-development', name: 'Resource Development', color: 'hsl(var(--tactic-resource-development))' },
  { id: 'initial-access', name: 'Initial Access', color: 'hsl(var(--tactic-initial-access))' },
  { id: 'execution', name: 'Execution', color: 'hsl(var(--tactic-execution))' },
  { id: 'persistence', name: 'Persistence', color: 'hsl(var(--tactic-persistence))' },
  { id: 'privilege-escalation', name: 'Privilege Escalation', color: 'hsl(var(--tactic-privilege-escalation))' },
  { id: 'defense-evasion', name: 'Defense Evasion', color: 'hsl(var(--tactic-defense-evasion))' },
  { id: 'credential-access', name: 'Credential Access', color: 'hsl(var(--tactic-credential-access))' },
  { id: 'discovery', name: 'Discovery', color: 'hsl(var(--tactic-discovery))' },
  { id: 'lateral-movement', name: 'Lateral Movement', color: 'hsl(var(--tactic-lateral-movement))' },
  { id: 'collection', name: 'Collection', color: 'hsl(var(--tactic-collection))' },
  { id: 'command-and-control', name: 'Command and Control', color: 'hsl(var(--tactic-command-control))' },
  { id: 'exfiltration', name: 'Exfiltration', color: 'hsl(var(--tactic-exfiltration))' },
  { id: 'impact', name: 'Impact', color: 'hsl(var(--tactic-impact))' },
];
