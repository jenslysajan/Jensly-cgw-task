import { LightningElement,wire,track} from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

export default class CreateInvoice extends LightningElement {
    @track dataToDisplay = [];
    @wire(CurrentPageReference)
    getPageReference({ state }) {
        console.log('state: '+JSON.stringify(state));
        for(const [param,value] of Object.entries(state)){
            const rowEntry = {'param': param.replace('c__',''), 'value':value.replaceAll('"','')};
            this.dataToDisplay.push(rowEntry);
        }
    }
}