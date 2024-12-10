import toast from 'toastit';
import {app} from './app-shell/app-shell.js';

export function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text);
	// toastit('Copied to clipboard.')
}

export function sleep(milli: number = 1000) {
	return new Promise((r) => setTimeout(r, milli));
}

export function preventDefault(event: Event) {
	event.preventDefault();
}

/**
 * Re-dispatches an event from the provided element.
 *
 * This function is useful for forwarding non-composed events, such as `change`
 * events.
 *
 * @example
 * class MyInput extends LitElement {
 *   render() {
 *     return html`<input @change=${this.redispatchEvent}>`;
 *   }
 *
 *   protected redispatchEvent(event: Event) {
 *     redispatchEvent(this, event);
 *   }
 * }
 *
 * @param element The element to dispatch the event from.
 * @param event The event to re-dispatch.
 * @return Whether or not the event was dispatched (if cancelable).
 */
export function redispatchEvent(element: Element, event: Event) {
	// For bubbling events in SSR light DOM (or composed), stop their propagation
	// and dispatch the copy.
	if (event.bubbles && (!element.shadowRoot || event.composed)) {
		event.stopPropagation();
	}

	const copy = Reflect.construct(event.constructor, [event.type, event]);
	const dispatched = element.dispatchEvent(copy);
	if (!dispatched) {
		event.preventDefault();
	}

	return dispatched;
}

const eventOpts = {composed: true, bubbles: true};
export function getElementsTree(node: Element): Promise<Element[]> {
	return new Promise((resolve, _reject) => {
		function f(event: Event) {
			resolve(event.composedPath() as Element[]);
			node.removeEventListener('get-elements-tree', f);
		}
		node.addEventListener('get-elements-tree', f);
		node.dispatchEvent(new Event('get-elements-tree', eventOpts));
	});
}
export async function getElementInTree(
	from: Element,
	condition: (element: Element) => boolean,
): Promise<Element | undefined> {
	for (const element of await getElementsTree(from)) {
		if (condition(element)) {
			return element;
		}
	}
}

export type AvailableLanguages = 'en-US' | 'ja-JP';

export async function recordVoice(
	language: AvailableLanguages,
	inputElement: HTMLInputElement,
) {
	// Check for browser compatibility
	if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
		throw new Error('Speech recognition is not supported in this browser.');
	}

	const SpeechRecognition =
		window.SpeechRecognition || (window as any).webkitSpeechRecognition;
	const recognition = new SpeechRecognition();

	recognition.lang = language;
	recognition.interimResults = true;
	recognition.continuous = true;

	// Handle microphone permission
	const stream = await navigator.mediaDevices.getUserMedia({audio: true});
	stream.getTracks().forEach((track) => track.stop()); // Release microphone right after obtaining permission

	// Start listening
	return new Promise<{stop: () => void}>((resolve, reject) => {
		let isRecording = true;

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			const transcript = Array.from(event.results)
				.map((result) => result[0].transcript)
				.join('');
			inputElement.value = transcript; // Update input element value
		};

		recognition.onerror = (event: ErrorEvent) => {
			toast('error occured');
			if (isRecording) {
				recognition.stop();
				app.recorder = undefined;
				reject(event.error);
			}
		};

		recognition.onend = () => {
			toast('ended');
			isRecording = false;
			app.recorder = undefined;
		};

		recognition.start();

		// Provide a function to stop the recorder
		resolve({
			stop: () => {
				if (isRecording) {
					recognition.stop();
				}
			},
		});
	});
}
