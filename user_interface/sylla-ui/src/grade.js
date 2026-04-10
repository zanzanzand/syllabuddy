export function computeFinalGrade(categories) {
    let total = 0;

    categories.forEach(cat => {
        let sum = 0;
        let max = 0;

        cat.items.forEach(item => {
            sum += Number(item.score) || 0;
            max += Number(item.total) || 0;
        });

        let categoryGrade = max > 0 ? sum / max : 0;
        total += categoryGrade * (cat.weight / 100);
    });

    return (total * 100).toFixed(2);
}