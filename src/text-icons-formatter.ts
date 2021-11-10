function formatTextIcons(rawText: string) {
    return rawText
        .replace(/\[reroll\]/ig, '<span class="icon reroll"></span>')
        .replace(/\[point\]/ig, '<span class="icon point"></span>')
        .replace(/\[symbol(\d)\]/ig, '<span class="icon symbol$1"></span>')
        .replace(/\[die:(\d):(\d)\]/ig, '<span class="die-icon" data-color="$1" data-face="$2"></span>')
}