import styles from "./ObservationsGrid.module.css";

export function ObservationsLegend() {
  return (
    <ul aria-label="Cell legend" className={styles.legend}>
      <li>
        <span
          aria-hidden="true"
          className={`${styles.swatch} ${styles.editable}`}
        />
        Editable
      </li>
      <li>
        <span
          aria-hidden="true"
          className={`${styles.swatch} ${styles.locked}`}
        />
        Locked
      </li>
      <li>
        <span
          aria-hidden="true"
          className={`${styles.swatch} ${styles.modified}`}
        />
        Modified (unsaved)
      </li>
    </ul>
  );
}
