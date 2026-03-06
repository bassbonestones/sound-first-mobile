# AdminScreen Reorganization

This folder contains the modular Admin screen structure. The reorganization is being done incrementally.

## Folder Structure

```
AdminScreen/
├── index.js                    # Main tab container (done)
├── README.md                   # This file
├── explorers/
│   ├── CapabilityExplorer.js   # Capability browser & editor
│   ├── MaterialExplorer.js     # Material browser
│   ├── FocusCardExplorer.js    # Focus card management
│   ├── SoftGateExplorer.js     # Soft gate rules & state
│   ├── UserProgressInspector.js # User mastery state viewer
│   └── SessionDiagnostics.js   # Session generation debugger
└── modals/
    ├── CapabilityEditModal.js  # Edit capability form
    ├── CapabilityCreateModal.js # Create capability form
    ├── DomainManageModal.js     # Domain renaming/reordering
    ├── MaterialDetailModal.js   # Material analysis view
    ├── FocusCardEditModal.js    # Focus card editor
    └── SoftGateEditModal.js     # Soft gate rule editor
```

## Migration Status

- [ ] CapabilityExplorer - ~1000 lines
- [ ] MaterialExplorer - ~400 lines  
- [ ] FocusCardExplorer - ~800 lines
- [ ] SoftGateExplorer - ~900 lines
- [ ] UserProgressInspector - ~330 lines
- [ ] SessionDiagnostics - ~450 lines
- [ ] Modals extraction

## Shared Resources

All admin components import from:
- `src/styles/admin.styles.js` - Shared styles
- `src/api/client.js` - API client with baseUrl
- `src/constants/` - Colors, instruments, notes

## Original File Location

The original monolithic AdminScreen.js (6105 lines) is at:
`screens/AdminScreen.js`

Once migration is complete, the original file will be deleted.
