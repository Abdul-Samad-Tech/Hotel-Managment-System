# Official access matrix (least privilege)

Azure Bay roles follow hotel separation of duties: **Admin = system**, **Manager = operations**, **Receptionist = desk**, **Housekeeping / Maintenance = task boards**, **Guest = own stay**.

## Portal tabs

| Tab | admin | manager | receptionist | housekeeping | maintenance | guest |
|-----|:-----:|:-------:|:------------:|:------------:|:-----------:|:-----:|
| Overview (reports) | ✓ | ✓ | | | | |
| Front desk | ✓ | ✓ | ✓ | | | |
| Messages | ✓ | ✓ | ✓ | | | |
| Dining — Kitchen / Tables | ✓ | ✓ | ✓ | | | |
| Dining — Menu / Reports | ✓ | ✓ | | | | |
| Guests | ✓ | ✓ | ✓ | | | |
| Inventory | ✓ | ✓ | | | | |
| Media | ✓ | ✓ | | | | |
| Housekeeping | ✓ (assign) | ✓ (assign) | view | ✓ (own queue) | | |
| Maintenance | ✓ (assign) | ✓ (assign) | view / report | | ✓ (resolve) | |
| Services | ✓ | ✓ | ✓ | | | |
| Staff + passwords | ✓ | | | | | |
| Settings (tax, booking window, stay policies) | ✓ | | | | | |
| Overview — publish/hide reviews | ✓ | ✓ | | | | |
| Alerts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Your stay / Profile | | | | | | ✓ |

## Design intent

- **Admin:** create staff, generate passwords, hotel settings (including stay policies); may oversee all ops tabs.
- **Manager:** run the house day-to-day (desk, F&B menu/reports, inventory amenities/media, assign HK/maintenance, publish reviews). Cannot create staff or change tax/settings/policies.
- **Receptionist:** arrivals, guests, messages, dining kitchen/seating, view HK board — not rates, media library, menu CRUD, or reports.
- **Housekeeping:** only unassigned + own tasks; claim unassigned by working them.
- **Maintenance:** tickets assigned to them / resolve path.
- **Guest:** register publicly; dining orders and room care only while `checked_in`.

## API notes

- Staff create / password reset: `admin` only.
- Dining menu admin + item CRUD + dining reports: `admin` | `manager`.
- Dining orders status + tables seating: desk roles include `receptionist`.
- Room type / physical room CRUD (incl. amenities): `admin` | `manager`.
- Stay policies (`Setting` `stayPolicies`): `admin` write; public `GET /public/stay-policies`.
- Feedback publish: `admin` | `manager` (`PATCH /feedback/:id`); public reads published only.

## Related

- `docs/ADMIN_PORTAL_GUIDE.md`
- `docs/ROOM_CONTENT.md`
- `docs/HOUSEKEEPING.md`
- `docs/DINING_SYSTEM.md`
- `docs/WORKLOG.md`
