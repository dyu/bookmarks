import { component } from 'vuets'

import { TodoView, default as TodoViewC } from './TodoView'

export class HomePage {
    todo_v: TodoView

    static activate(self: HomePage) {
        let todo_v = self.todo_v || (self.todo_v = self['$refs']['todo_v'])
        TodoView.activate(todo_v)
    }
}
export default component({
    mounted(this: HomePage) { HomePage.activate(this) },
    components: {
        TodoViewC
    },
    template: /**/`
<div class="row">
  <todo-view-c ref="todo_v"></todo-view-c>
</div>`/**/
}, HomePage)