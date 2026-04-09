<script>
    import { calendarTheme, calendarBackground, backgroundOpacity, categoryColors } from './store.js'

    // Theme state
    let selectedTheme = $state('light')
    let bgImage = $state('')
    let bgOpacity = $state(1)
    let saveThemeStatus = $state('')

    // Color state
    let colors = $state({
        'exam': '#FF6B6B',
        'assignment': '#4ECDC4',
        'project': '#45B7D1',
        'quiz': '#96CEB4',
        'other': '#DDA0DD'
    })
    let saveColorStatus = $state('')
    let colorWarning = $state('')

    // Load preferences on mount
    $effect(() => {
        fetch('http://localhost:3000/preferences', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.calendarTheme) {
                    selectedTheme = data.calendarTheme
                    calendarTheme.set(data.calendarTheme)
                }
                if (data.calendarBackground) {
                    bgImage = data.calendarBackground
                    calendarBackground.set(data.calendarBackground)
                }
                if (data.backgroundOpacity !== undefined) {
                    bgOpacity = data.backgroundOpacity
                    backgroundOpacity.set(data.backgroundOpacity)
                }
                if (data.categoryColors) {
                    colors = { ...data.categoryColors }
                    categoryColors.set(colors)
                }
            })
            .catch(err => console.error('Failed to load preferences:', err))
    })

    // Handle background image upload
    function handleBgUpload(e) {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            bgImage = ev.target.result
        }
        reader.readAsDataURL(file)
    }

    // Save theme
    async function saveTheme() {
        try {
            const res = await fetch('http://localhost:3000/preferences/theme', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    calendarTheme: selectedTheme,
                    calendarBackground: bgImage,
                    backgroundOpacity: bgOpacity
                })
            })
            if (res.ok) {
                calendarTheme.set(selectedTheme)
                calendarBackground.set(bgImage)
                backgroundOpacity.set(bgOpacity)
                saveThemeStatus = 'Theme saved!'
                setTimeout(() => saveThemeStatus = '', 2000)
            }
        } catch (err) {
            saveThemeStatus = 'Failed to save theme.'
        }
    }

    // Check color readability warning
    function checkColorWarning(hex) {
        const r = parseInt(hex.slice(1,3), 16)
        const g = parseInt(hex.slice(3,5), 16)
        const b = parseInt(hex.slice(5,7), 16)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000
        return brightness > 240 || brightness < 15
    }

    // Save colors
    async function saveColors() {
        const hasWarning = Object.values(colors).some(c => checkColorWarning(c))
        if (hasWarning) {
            colorWarning = 'Warning: Some colors may be too bright or dark for readability.'
        } else {
            colorWarning = ''
        }
        try {
            const res = await fetch('http://localhost:3000/preferences/colors', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ categoryColors: colors })
            })
            if (res.ok) {
                categoryColors.set(colors)
                saveColorStatus = 'Colors saved!'
                setTimeout(() => saveColorStatus = '', 2000)
            }
        } catch (err) {
            saveColorStatus = 'Failed to save colors.'
        }
    }

    // Reset colors
    async function resetColors() {
        try {
            const res = await fetch('http://localhost:3000/preferences/colors/reset', {
                method: 'PUT',
                credentials: 'include'
            })
            if (res.ok) {
                const data = await res.json()
                colors = { ...data.categoryColors }
                categoryColors.set(colors)
                colorWarning = ''
                saveColorStatus = 'Colors reset to default!'
                setTimeout(() => saveColorStatus = '', 2000)
            }
        } catch (err) {
            saveColorStatus = 'Failed to reset colors.'
        }
    }
</script>

<div class="settings-page">
    <h1>Settings</h1>

    <!-- Calendar Theme Customization -->
    <section class="settings-section">
        <h2>Calendar Theme</h2>

        <div class="theme-options">
            <label class:active={selectedTheme === 'light'}>
                <input type="radio" bind:group={selectedTheme} value="light" />
                Light
            </label>
            <label class:active={selectedTheme === 'dark'}>
                <input type="radio" bind:group={selectedTheme} value="dark" />
                Dark
            </label>
            <label class:active={selectedTheme === 'high-contrast'}>
                <input type="radio" bind:group={selectedTheme} value="high-contrast" />
                High Contrast
            </label>
        </div>

        <div class="form-group">
            <label for="bg-upload">Background Image (optional)</label>
            <input type="file" id="bg-upload" accept=".jpg,.jpeg,.png" onchange={handleBgUpload} />
        </div>

        {#if bgImage}
            <div class="bg-preview">
                <img src={bgImage} alt="Background preview" />
                <button class="remove-btn" onclick={() => bgImage = ''}>Remove</button>
            </div>
            <div class="form-group">
                <label for="opacity">Background Opacity: {Math.round(bgOpacity * 100)}%</label>
                <input type="range" id="opacity" min="0" max="1" step="0.05" bind:value={bgOpacity} />
            </div>
        {/if}

        <button class="save-btn" onclick={saveTheme}>Save Theme</button>
        {#if saveThemeStatus}<p class="status">{saveThemeStatus}</p>{/if}
    </section>

    <!-- Category Color Coding -->
    <section class="settings-section">
        <h2>Category Colors</h2>
        <p class="hint">Assign colors to event categories. These will appear across the Calendar and Dashboard.</p>

        <div class="color-grid">
            {#each Object.entries(colors) as [category, color]}
                <div class="color-row">
                    <span class="category-label">{category}</span>
                    <input 
                        type="color" 
                        value={color}
                        oninput={(e) => colors = { ...colors, [category]: e.target.value }}
                    />
                    <input 
                        type="text" 
                        value={color}
                        placeholder="#000000"
                        oninput={(e) => colors = { ...colors, [category]: e.target.value }}
                    />
                </div>
            {/each}
        </div>

        {#if colorWarning}<p class="warning">{colorWarning}</p>{/if}

        <div class="btn-row">
            <button class="save-btn" onclick={saveColors}>Save Colors</button>
            <button class="reset-btn" onclick={resetColors}>Reset to Default</button>
        </div>
        {#if saveColorStatus}<p class="status">{saveColorStatus}</p>{/if}
    </section>
</div>

<style>
    .settings-page {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem;
        font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    }

    h1 {
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 2rem;
    }

    .settings-section {
        background: #fff;
        border: 1px solid oklch(92.2% 0 0);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
    }

    h2 {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
    }

    .theme-options {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .theme-options label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid oklch(87% 0 0);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
    }

    .theme-options label.active {
        border-color: #4ECDC4;
        background: #f0fffe;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #64748b;
    }

    .bg-preview {
        margin-bottom: 1rem;
        position: relative;
        display: inline-block;
    }

    .bg-preview img {
        width: 200px;
        height: 120px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid oklch(87% 0 0);
    }

    .remove-btn {
        display: block;
        margin-top: 0.5rem;
        background: #fff;
        border: 1px solid oklch(87% 0 0);
        border-radius: 6px;
        padding: 4px 12px;
        cursor: pointer;
        font-size: 0.875rem;
    }

    .remove-btn:hover {
        background: oklch(92.2% 0 0);
    }

    .color-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .color-row {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .category-label {
        width: 100px;
        font-weight: 600;
        text-transform: capitalize;
        font-size: 0.9rem;
    }

    .color-row input[type="color"] {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        padding: 0;
    }

    .color-row input[type="text"] {
        width: 100px;
        padding: 6px 10px;
        border: 1px solid oklch(87% 0 0);
        border-radius: 6px;
        font-size: 0.875rem;
        font-family: monospace;
    }

    .hint {
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 1rem;
    }

    .warning {
        color: #e67e22;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .btn-row {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
    }

    .save-btn {
        background: #4ECDC4;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-weight: 600;
        cursor: pointer;
    }

    .save-btn:hover {
        background: #3dbdb4;
    }

    .reset-btn {
        background: #fff;
        color: #64748b;
        border: 1px solid oklch(87% 0 0);
        border-radius: 8px;
        padding: 10px 20px;
        font-weight: 600;
        cursor: pointer;
    }

    .reset-btn:hover {
        background: oklch(92.2% 0 0);
    }

    .status {
        color: #27ae60;
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }
</style>