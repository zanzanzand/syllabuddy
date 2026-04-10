import { writable } from 'svelte/store'
export const currPage = writable('calendar')
export const scannedSyllabus = writable(null)
export const calendarTheme = writable('light')
export const calendarBackground = writable('')
export const backgroundOpacity = writable(1)
export const categoryColors = writable({
    'exam': '#FF6B6B',
    'assignment': '#4ECDC4',
    'project': '#45B7D1',
    'quiz': '#96CEB4',
    'other': '#DDA0DD'
})