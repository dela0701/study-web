const template = `
<div class="row"> 
    <ol class="breadcrumb"> 
        <li v-for="item in previous"><a v-bind:href="item.href">{{item.name}}</a></li> 
        <li class="active">{{title}}</li> 
    </ol> 
</div>`;

Vue.component('breadcrumb', {
	template: template,
	data() {
		return {
			title: $('head title').text()
		};
	},
	props: {
		previous: {
			type: Array,
			require: true,
			validator(vals) {
				if (!Array.isArray(vals)) {
					return false;
				}

				let ok = true;
				for (let val of vals) {
					if (typeof val !== 'object') {
						ok = false;
					} else {
						ok = val.name && val.href;
					}
					if (!ok) {
						return false;
					}
				}
				return ok;
			},
			default: []
		}
	}
});