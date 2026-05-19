import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function FaIcon({ icon, style, ...props }) {
  return <FontAwesomeIcon icon={icon} style={style} {...props} />;
}
