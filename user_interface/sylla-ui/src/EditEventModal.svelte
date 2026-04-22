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
		padding: 1em;
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
		display: block;
        float: right;
        padding: 4px;
        background: none;
        border-radius: 30%;

	}
    button:hover{
        border-color: oklch(87% 0 0);
        background-color: oklch(92.2% 0 0);
    }
</style>
