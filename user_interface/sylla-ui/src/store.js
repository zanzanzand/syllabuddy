import { writable } from 'svelte/store'
export const currPage = writable('calendar')
export const scannedSyllabus = writable(null)