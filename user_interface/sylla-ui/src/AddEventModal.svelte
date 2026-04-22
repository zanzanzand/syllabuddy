<script>
	let { showModal = $bindable(), header, children } = $props();

	let dialog = $state(); // HTMLDialogElement

	$effect(() => {
		if (showModal) {
            dialog.showModal();
        } else {
            dialog?.close();  // add this line
        }
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclose={() => (showModal = false)}
	onclick={(e) => { if (e.target === dialog) dialog.close(); }}
>
	<div>
        <!-- svelte-ignore a11y_autofocus -->
        <button autofocus onclick={() => dialog.close()}>X</button>
        <br>
		{@render header?.()}
		
		{@render children?.()}
		
		
		
	</div>
</dialog>

<style>
	dialog {
		max-width: 32em;
		border-radius: 0.4em;
		border: none;
		padding: 0;
        margin: 0 auto;
        margin-top: 5em;
        background: #fff;
        color: black;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
    padding: 1.5em;
    position: relative;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 600;
    color: #666;
    cursor: pointer;
    padding: 0;
	}

	button:hover {
		background: #ebebeb;
		color: #333;
	}
</style>
