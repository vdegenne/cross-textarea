import {LitElement, html} from 'lit';
import {customElement, query} from 'lit/decorators.js';
import {withStyles} from 'lit-with-styles';
import styles from './app-shell.css?inline';
import {materialShellLoadingOff} from 'material-shell';

declare global {
	interface Window {
		app: AppShell;
	}
	interface HTMLElementTagNameMap {
		'app-shell': AppShell;
	}
}

@customElement('app-shell')
@withStyles(styles)
export class AppShell extends LitElement {
	#sendDebouncer: number;
	#receiveDebouncer: number;

	@query('#textfield') textfield: HTMLTextAreaElement;

	firstUpdated() {
		materialShellLoadingOff.call(this);

		this.receive();
	}

	send() {
		clearTimeout(this.#sendDebouncer);
		clearTimeout(this.#receiveDebouncer);
		this.#sendDebouncer = setTimeout(() => {
			fetch('/api/save', {
				method: 'POST',
				headers: {'content-type': 'application/json'},
				body: JSON.stringify({input: this.textfield.value}),
			});
		}, 600);
		this.receive(); // debouncer
	}

	receive() {
		clearTimeout(this.#receiveDebouncer);
		this.#receiveDebouncer = setTimeout(async () => {
			const {input} = await (await fetch('/api/get')).json();
			this.textfield.value = input;
			this.receive();
		}, 800);
	}

	render() {
		return html`<!-- -->
			<div class="absolute inset-0 flex items-center justify-center">
				<md-filled-text-field
					autofocus
					id="textfield"
					class="resize-y"
					type="textarea"
					rows="12"
					style="width:calc(100% - 48px);--md-sys-typescale-body-large-size:2rem;--md-sys-typescale-body-large-line-height:2rem;"
					@keydown=${this.send}
				></md-filled-text-field>
			</div>
			<!-- -->`;
	}

	sendInfo() {}
}

export const app = (window.app = new AppShell());
