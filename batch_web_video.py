import argparse
import subprocess
from pathlib import Path
import shlex
import sys

VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v"}


def build_ffmpeg_cmd(
    input_path: Path,
    output_path: Path,
    crf: int = 22,
    preset: str = "slow",
    max_edge: int = 1280,
    maxrate: str = "6M",
    bufsize: str = "12M",
    keep_audio: bool = False,
    fps: float = None,
):
    """
    Build an ffmpeg command for web-friendly project page videos.
    """

    # 保持宽高比，最长边限制到 max_edge，另一边自动取偶数
    scale_filter = (
        f"scale='if(gt(iw,ih),min(iw,{max_edge}),-2)':'if(gt(ih,iw),min(ih,{max_edge}),-2)'"
    )

    vf_parts = [scale_filter]
    if fps is not None:
        vf_parts.append(f"fps={fps}")

    vf_arg = ",".join(vf_parts)

    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(input_path),
        "-map_metadata", "-1",             # 去掉多余元数据
        "-c:v", "libx264",
        "-preset", preset,
        "-crf", str(crf),
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-vf", vf_arg,
        "-maxrate", maxrate,
        "-bufsize", bufsize,
        "-profile:v", "high",
        "-level", "4.1",
    ]

    if keep_audio:
        cmd += ["-c:a", "aac", "-b:a", "128k"]
    else:
        cmd += ["-an"]

    cmd.append(str(output_path))
    return cmd


def transcode_video(
    input_path: Path,
    output_path: Path,
    crf: int,
    preset: str,
    max_edge: int,
    maxrate: str,
    bufsize: str,
    keep_audio: bool,
    fps: float,
    overwrite: bool,
):
    if output_path.exists() and not overwrite:
        print(f"[Skip] Exists: {output_path}")
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = build_ffmpeg_cmd(
        input_path=input_path,
        output_path=output_path,
        crf=crf,
        preset=preset,
        max_edge=max_edge,
        maxrate=maxrate,
        bufsize=bufsize,
        keep_audio=keep_audio,
        fps=fps,
    )

    print(f"[Processing] {input_path}")
    print(" ".join(shlex.quote(x) for x in cmd))

    result = subprocess.run(cmd)
    if result.returncode != 0:
        print(f"[Failed] {input_path}", file=sys.stderr)
    else:
        print(f"[Done] {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Batch transcode videos for project page usage."
    )
    parser.add_argument("--input_dir", type=str, required=True, help="Input video directory")
    parser.add_argument("--output_dir", type=str, required=True, help="Output video directory")
    parser.add_argument("--crf", type=int, default=22, help="Quality control (lower = better quality, larger file)")
    parser.add_argument("--preset", type=str, default="slow", help="ffmpeg x264 preset")
    parser.add_argument("--max_edge", type=int, default=1280, help="Maximum width/height")
    parser.add_argument("--maxrate", type=str, default="6M", help="Max video bitrate")
    parser.add_argument("--bufsize", type=str, default="12M", help="Bitrate buffer size")
    parser.add_argument("--fps", type=float, default=None, help="Optional output FPS, e.g. 24 or 30")
    parser.add_argument("--keep_audio", action="store_true", help="Keep audio track")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)

    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory does not exist: {input_dir}")

    video_files = [p for p in input_dir.rglob("*") if p.suffix.lower() in VIDEO_EXTS]

    if not video_files:
        print("No video files found.")
        return

    print(f"Found {len(video_files)} video(s).")

    for input_path in video_files:
        rel_path = input_path.relative_to(input_dir)
        output_path = (output_dir / rel_path).with_suffix(".mp4")

        transcode_video(
            input_path=input_path,
            output_path=output_path,
            crf=args.crf,
            preset=args.preset,
            max_edge=args.max_edge,
            maxrate=args.maxrate,
            bufsize=args.bufsize,
            keep_audio=args.keep_audio,
            fps=args.fps,
            overwrite=args.overwrite,
        )


if __name__ == "__main__":
    main()