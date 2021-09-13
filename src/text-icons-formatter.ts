function formatTextIcons(rawText: string) {
    return rawText
        .replace(/\[reroll\]/ig, '<span class="icon reroll"></span>')
}