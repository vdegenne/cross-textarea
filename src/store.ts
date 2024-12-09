import {ReactiveController, state} from '@snar/lit';
// import { saveToLocalStorage } from "snar-save-to-local-storage";

// @saveToLocalStorage('something')
export class AppStore extends ReactiveController {
	@state() var = '';
}

export const store = new AppStore();
