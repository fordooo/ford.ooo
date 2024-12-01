import styles from './noise.module.css'
import noiseImage from './noise.png'

export default function BackgroundNoise() {
  return (
    <div
      className={styles.noise}
      style={{
        backgroundImage: `url(${noiseImage.src})`,
      }}
    />
  )
}
