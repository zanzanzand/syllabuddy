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
            <img src={URL.createObjectURL(file)} width="120" />
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