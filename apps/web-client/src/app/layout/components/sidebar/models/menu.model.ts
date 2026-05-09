import { ModuleEnum } from '../../../../core/models/permission.model';

/**
 * Sidebar menu node — produced by {@link MenuService.buildMenu} from the
 * flat menu list returned by the backend in the login response.
 *
 * The tree has up to three levels: Module → Submodule → Form/Report.
 */
export interface MenuItem {
  formId: string;
  type?: 'form' | 'report';
  formName: string;
  icon: string;
  route?: string;
  module?: ModuleEnum | string;
  code?: string;
  subModule?: string;
  children?: MenuItem[];
  badge?: string;
  badgeColor?: 'primary' | 'accent' | 'warn';
  expanded?: boolean;
  dividerAfter?: boolean;
  module_serial?: number;
}
