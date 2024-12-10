import {LitElement, html} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {withStyles} from 'lit-with-styles';
import styles from './app-shell.css?inline';
import {materialShellLoadingOff} from 'material-shell';
import {type AvailableLanguages, recordVoice} from '../utils.js';

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

	@state() recorder:
		| {language: AvailableLanguages; stop: () => void}
		| undefined = undefined;

	@query('#textfield') textfield: HTMLInputElement;

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
		return;
		clearTimeout(this.#receiveDebouncer);
		this.#receiveDebouncer = setTimeout(async () => {
			const {input} = await (await fetch('/api/get')).json();
			this.textfield.value = input;
			this.receive();
		}, 800);
	}

	render() {
		return html`<!-- -->
			<div class="absolute inset-0 flex flex-col items-center justify-center">
				<md-filled-text-field
					autofocus
					id="textfield"
					class="resize-y"
					type="textarea"
					rows="12"
					style="width:calc(100% - 48px);--md-sys-typescale-body-large-size:2rem;--md-sys-typescale-body-large-line-height:2rem;"
					@keydown=${this.send}
				>
					<md-icon-button
						slot="trailing-icon"
						@click=${() => {
							this.textfield.value = '';
							this.send();
							this.textfield.focus();
						}}
					>
						<md-icon>close</md-icon>
					</md-icon-button>
				</md-filled-text-field>

				<div class="m-6 flex gap-3">
					<md-filled-tonal-button
						?disabled=${this.recorder && this.recorder.language !== 'en-US'}
						@click=${() => {
							if (this.recorder && this.recorder.language === 'en-US') {
								this.stopRecorder();
							} else {
								this.speak('en-US');
							}
						}}
					>
						${this.recorder && this.recorder.language === 'en-US'
							? html`<span id="stop-span">STOP</span>`
							: 'Speak English'}
					</md-filled-tonal-button>

					<md-filled-tonal-button
						?disabled=${this.recorder && this.recorder.language !== 'ja-JP'}
						@click=${() => {
							if (this.recorder && this.recorder.language === 'ja-JP') {
								this.stopRecorder();
							} else {
								this.speak('ja-JP');
							}
						}}
					>
						${this.recorder && this.recorder.language === 'ja-JP'
							? html`<span id="stop-span">STOP</span>`
							: 'Speak Japanese'}
					</md-filled-tonal-button>
				</div>
			</div>
			<!-- -->`;
	}

	async speak(language: AvailableLanguages) {
		const {stop} = await recordVoice(language, this.textfield);
		this.recorder = {language, stop};
	}

	stopRecorder() {
		if (this.recorder) {
			this.recorder.stop();
			// this.recorder = undefined;
		}
	}
}

export const app = (window.app = new AppShell());
