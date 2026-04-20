<script>
  import { computeFinalGrade } from "./grade.js";
  import { scannedSyllabus } from './store.js'

  let categories = [];

  function addCategory() {
    categories = [
      ...categories,
      { name: "", weight: "", items: [] }
    ];
  }

  function addItem(i) {
    categories[i].items.push({
      name: "",
      score: "",
      total: ""
    });
    categories = categories;
  }

  function removeCategory(i) {
    categories.splice(i, 1);
    categories = categories;
  }

  function removeItem(i, j) {
    categories[i].items.splice(j, 1);
    categories = categories;
  }

async function handleUpload(file) {
  const base64 = await fileToBase64(file);

  const res = await fetch('http://localhost:3000/parse-grades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileBuffer: base64.split(',')[1],
      mimeType: file.type
    })
  });

  const data = await res.json();

  $scannedSyllabus = {
    ...$scannedSyllabus,
    grading: data.grading
  };
}

  $: finalGrade = computeFinalGrade(categories);
</script>

<div class="max-w-4xl mx-auto mt-6 space-y-6">

  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Grade Calculator</h1>
    <button
      class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      on:click={addCategory}>
      + Add Category
    </button>
  </div>

  {#each categories as cat, i}
    <div class="border rounded-lg p-4 shadow-sm bg-white space-y-4">

      <!-- Category Header -->
      <div class="flex flex-col sm:flex-row gap-2">
        <input
          class="border p-2 rounded w-full"
          placeholder="Category Name"
          bind:value={cat.name}
        />

        <input
          type="number"
          class="border p-2 rounded w-full sm:w-32"
          placeholder="Weight %"
          bind:value={cat.weight}
        />

        <button
          class="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
          on:click={() => removeCategory(i)}>
          Delete
        </button>
      </div>

      <!-- Items -->
      <div class="space-y-3 pl-2 border-l-2 border-gray-200">

        {#each cat.items as item, j}
          <div class="grid grid-cols-12 gap-2 items-center">

            <!-- Item name -->
            <input
            class="border p-2 rounded col-span-6"
            placeholder="Item Name"
            bind:value={item.name}
            />

            <!-- Score / Total group -->
            <div class="flex items-center gap-2 col-span-4">
            <input
                type="number"
                class="border p-2 rounded w-full"
                placeholder="Score"
                bind:value={item.score}
            />

            <span class="text-gray-500">/</span>

            <input
                type="number"
                class="border p-2 rounded w-full"
                placeholder="Total"
                bind:value={item.total}
            />
            </div>

            <!-- Remove button -->
            <button
            class="bg-red-400 text-white px-3 py-2 rounded hover:bg-red-500 col-span-2"
            on:click={() => removeItem(i, j)}>
            Remove
            </button>

          </div>
        {/each}

        <button
          class="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
          on:click={() => addItem(i)}>
          + Add Item
        </button>

      </div>
    </div>
  {/each}

  <!-- Final Grade -->
  <div class="text-center text-xl font-semibold border rounded-lg p-4 bg-gray-50">
    Final Grade: {finalGrade}%
  </div>

</div>