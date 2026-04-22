<script>
    import { onMount } from 'svelte'

    let user = {}
    let file = null
    let imageSrc = '/pfpdefault.jpg'
    let fileInput

    onMount(async () => {
        const res = await fetch('http://localhost:3000/profile', {
            credentials: 'include'
        })
        user = await res.json()
        updateImage()
    })

    function updateImage() {
        imageSrc = user.profilePicture ? user.profilePicture : '/pfpdefault.jpg'
    }

    async function uploadPicture() {
        if (!file) return alert("No file selected")

        const formData = new FormData()
        formData.append('picture', file)

        const res = await fetch('http://localhost:3000/profile/picture', {
            method: 'PUT',
            body: formData,
            credentials: 'include'
        })

        const data = await res.json()
        user.profilePicture = data.profilePicture
        updateImage()

        file = null
        fileInput.value = ''
    }

    async function removePicture() {
        await fetch('http://localhost:3000/profile/picture', {
            method: 'DELETE',
            credentials: 'include'
        })

        user.profilePicture = ''
        updateImage()

        file = null
        fileInput.value = ''
    }

    async function deleteAccount() {
        const confirmDelete = confirm("Are you sure you want to delete your account?")
        if (!confirmDelete) return
        await fetch('http://localhost:3000/delete-account', {
            method: 'DELETE',
            credentials: 'include'
        })

        window.location.href = '/'
    }
</script>

{#if user.displayName}
    <div class="card">
        <h2 class="profile-title">Profile</h2>

        <div class="profile-row">
            <img 
                src={imageSrc}
                alt="Profile"
                class="pfp"
                referrerpolicy="no-referrer"
                on:error={() => imageSrc = '/pfpdefault.jpg'}
            />
            
            <div class="profile-info">
                <p class="label">Name</p>
                <p class="value">{user.displayName}</p>

                <p class="label">Email</p>
                <p class="value">{user.email}</p>
            </div> 
        </div>

        <hr />

        <input 
            type="file" 
            bind:this={fileInput}
            on:change={(e) => file = e.target.files?.[0]} 
        />

        {#if file}
            <p>Preview:</p>
            <img src={URL.createObjectURL(file)} alt="profile-pictre" />
        {/if}

        <br /><br />

        <button on:click={uploadPicture}>Upload Picture</button>
        <button on:click={removePicture}>Remove Picture</button>

        <button on:click={deleteAccount} style="color:red">
            Delete Account
        </button>
    </div>
{:else}
    <p>Loading...</p>
{/if}

<style>
    .card {
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
    }

    .profile-title {
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0 0 1.25rem;
        color: #1a1a1a;
    }

    .profile-row {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        margin-bottom: 1.25rem;
        min-width: 0;
    }

    .pfp {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 2px solid #e8e5df;
    }

    .profile-info {
        min-width: 0;
        flex: 1;
    }

    .label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0 0 2px;
    }

    .value {
        font-size: 1rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 0.75rem;
    }

    .email {
        font-size: 0.875rem;
        font-weight: 400;
        color: #444;
        word-break: break-all;
        overflow-wrap: break-word;
    }

    hr {
        border: none;
        border-top: 1px solid #e8e5df;
        margin: 0 0 1.25rem;
    }

    .file-row {
        margin-bottom: 1rem;
    }

    .preview-img {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 1rem;
        border: 2px solid #e8e5df;
    }

    .btn-row {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        align-items: center;
    }

    .action-btn {
        background: #fff;
        color: #333;
        border: 1px solid #e8e5df;
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s;
    }

    .action-btn:hover {
        background: #f5f5f5;
    }

    .delete-btn {
        background: none;
        border: none;
        color: #e74c3c;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        padding: 8px 4px;
    }

    .delete-btn:hover {
        text-decoration: underline;
    }
</style>