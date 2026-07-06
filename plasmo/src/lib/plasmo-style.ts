import cssText from "data-text:~style.css"

/**
 * Tailwind等のスタイルをShadow DOM内に適用するための関数
 */
export const getDefaultStyle = (): HTMLStyleElement => {
	const baseFontSize = 16

	let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
	const remRegex = /([\d.]+)rem/g
	updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
		const pixelsValue = parseFloat(remValue) * baseFontSize
		return `${pixelsValue}px`
	})

	const styleElement = document.createElement("style")
	styleElement.textContent = updatedCssText
	return styleElement
}