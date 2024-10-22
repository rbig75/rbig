document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const resultContainer = document.getElementById('resultContainer');
    const subtitlesElement = document.getElementById('subtitles');
    const downloadButton = document.getElementById('downloadButton');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('videoFile').files[0];
        const sourceLanguage = document.getElementById('sourceLanguage').value;
        const targetLanguage = document.getElementById('targetLanguage').value;

        if (!file) {
            alert('Veuillez sélectionner un fichier vidéo.');
            return;
        }

        // Simuler le processus de transcription
        progressContainer.style.display = 'block';
        for (let i = 0; i <= 100; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            progressBar.value = i;
            progressText.textContent = `${i}%`;
        }

        // Générer des sous-titres factices
        const subtitles = generateFakeSubtitles();
        subtitlesElement.textContent = subtitles;
        resultContainer.style.display = 'block';
    });

    downloadButton.addEventListener('click', () => {
        const subtitles = subtitlesElement.textContent;
        const blob = new Blob([subtitles], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'subtitles.srt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});

function generateFakeSubtitles() {
    const lines = [
        "1",
        "00:00:01,000 --> 00:00:04,000",
        "Bonjour et bienvenue dans cette vidéo.",
        "",
        "2",
        "00:00:04,500 --> 00:00:08,000",
        "Aujourd'hui, nous allons parler de la transcription vidéo.",
        "",
        "3",
        "00:00:08,500 --> 00:00:12,000",
        "C'est un processus fascinant et très utile.",
        "",
        "4",
        "00:00:12,500 --> 00:00:16,000",
        "Merci d'avoir regardé cette démonstration."
    ];
    return lines.join('\n');
}