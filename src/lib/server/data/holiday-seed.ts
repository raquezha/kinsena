/**
 * Official Philippine regular and special non-working national holidays.
 *
 * 2026: Proclamation No. 1006 (3 September 2025), published in the Official
 * Gazette, 121 OG No. 37, 9531 (15 September 2025). Text verified via the
 * Supreme Court E-Library
 * (https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/7/99678)
 * and Lawphil (https://lawphil.net/executive/proc/proc2025/proc_1006_2025.html).
 *
 * 2027: Proclamation No. 1427 (8 September 2026). Text verified via Lawphil
 * (https://lawphil.net/executive/proc/proc2026/proc_1427_2026.html) and the
 * Department of Energy posting of the proclamation
 * (https://doe.gov.ph/delaring-the-regular-holidays-and-special-non-working-days-for-the-year-2027).
 *
 * Official Gazette and PCO HTML pages could not be fetched in this pass;
 * the Gazette publication for 1006 is cited by the Supreme Court E-Library.
 *
 * Special (working) days such as the EDSA People Power Revolution Anniversary
 * are not seeded — they are working days, so salary can still arrive then.
 *
 * Eid'l Fitr and Eid'l Adha are regular holidays whose dates are proclaimed
 * later (Proc. 1006 s. 2; Proc. 1427 s. 2). Add them here when declared.
 */
import type { HolidayKind } from '../../domain/pay-rule.ts';

export interface OfficialHoliday {
	date: string;
	name: string;
	kind: HolidayKind;
}

export const OFFICIAL_NATIONAL_HOLIDAYS: OfficialHoliday[] = [
	// Proclamation No. 1006 (2026), regular holidays
	{ date: '2026-01-01', name: "New Year's Day", kind: 'NATIONAL' },
	{ date: '2026-04-02', name: 'Maundy Thursday', kind: 'NATIONAL' },
	{ date: '2026-04-03', name: 'Good Friday', kind: 'NATIONAL' },
	{ date: '2026-04-09', name: 'Araw ng Kagitingan', kind: 'NATIONAL' },
	{ date: '2026-05-01', name: 'Labor Day', kind: 'NATIONAL' },
	{ date: '2026-06-12', name: 'Independence Day', kind: 'NATIONAL' },
	{ date: '2026-08-31', name: 'National Heroes Day', kind: 'NATIONAL' },
	{ date: '2026-11-30', name: 'Bonifacio Day', kind: 'NATIONAL' },
	{ date: '2026-12-25', name: 'Christmas Day', kind: 'NATIONAL' },
	{ date: '2026-12-30', name: 'Rizal Day', kind: 'NATIONAL' },
	// Proc. 1006 special (non-working) days
	{ date: '2026-08-21', name: 'Ninoy Aquino Day', kind: 'NATIONAL' },
	{ date: '2026-11-01', name: "All Saints' Day", kind: 'NATIONAL' },
	{
		date: '2026-12-08',
		name: 'Feast of the Immaculate Conception of Mary',
		kind: 'NATIONAL'
	},
	{ date: '2026-12-31', name: 'Last Day of the Year', kind: 'NATIONAL' },
	// Proc. 1006 additional special (non-working) days
	{ date: '2026-02-17', name: 'Chinese New Year', kind: 'NATIONAL' },
	{ date: '2026-04-04', name: 'Black Saturday', kind: 'NATIONAL' },
	{ date: '2026-11-02', name: "All Souls' Day", kind: 'NATIONAL' },
	{ date: '2026-12-24', name: 'Christmas Eve', kind: 'NATIONAL' },
	// Proclamation No. 1427 (2027), regular holidays
	{ date: '2027-01-01', name: "New Year's Day", kind: 'NATIONAL' },
	{ date: '2027-03-25', name: 'Maundy Thursday', kind: 'NATIONAL' },
	{ date: '2027-03-26', name: 'Good Friday', kind: 'NATIONAL' },
	{ date: '2027-04-09', name: 'Araw ng Kagitingan', kind: 'NATIONAL' },
	{ date: '2027-05-01', name: 'Labor Day', kind: 'NATIONAL' },
	{ date: '2027-06-12', name: 'Independence Day', kind: 'NATIONAL' },
	{ date: '2027-08-30', name: 'National Heroes Day', kind: 'NATIONAL' },
	{ date: '2027-11-30', name: 'Bonifacio Day', kind: 'NATIONAL' },
	{ date: '2027-12-25', name: 'Christmas Day', kind: 'NATIONAL' },
	{ date: '2027-12-30', name: 'Rizal Day', kind: 'NATIONAL' },
	// Proc. 1427 special (non-working) days
	{ date: '2027-08-21', name: 'Ninoy Aquino Day', kind: 'NATIONAL' },
	{ date: '2027-11-01', name: "All Saints' Day", kind: 'NATIONAL' },
	{
		date: '2027-12-08',
		name: 'Feast of the Immaculate Conception of Mary',
		kind: 'NATIONAL'
	},
	{ date: '2027-12-31', name: 'Last Day of the Year', kind: 'NATIONAL' },
	// Proc. 1427 additional special (non-working) days
	{ date: '2027-02-06', name: 'Chinese New Year', kind: 'NATIONAL' },
	{ date: '2027-03-27', name: 'Black Saturday', kind: 'NATIONAL' },
	{ date: '2027-11-02', name: "All Souls' Day", kind: 'NATIONAL' },
	{ date: '2027-12-24', name: 'Christmas Eve', kind: 'NATIONAL' }
];
