#!/bin/bash

# 版本管理脚本 - 结合 version.md 和 Git 标签
# 使用方法: ./tag-version.sh [命令] [参数]

VERSION_FILE="version.md"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 从 version.md 提取最新版本号
get_latest_version() {
    if [ ! -f "$VERSION_FILE" ]; then
        echo ""
        return
    fi
    
    # 提取第一行 # Version X.X 中的版本号
    version=$(head -n 1 "$VERSION_FILE" | sed -E 's/^# Version ([0-9]+\.[0-9.]+).*/\1/')
    echo "$version"
}

# 获取版本描述（版本号下面的内容，直到下一个版本）
get_version_description() {
    local version=$1
    if [ ! -f "$VERSION_FILE" ]; then
        echo ""
        return
    fi
    
    # 提取该版本下的所有内容（直到下一个 # Version 或文件结束）
    awk -v target="Version $version" '
        /^# Version / { 
            if (found) exit
            if ($0 ~ target) found=1
            next
        }
        found { print }
        /^# Version / && found { exit }
    ' "$VERSION_FILE" | sed 's/^- /  - /' | head -20
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}版本管理脚本 - 结合 version.md 和 Git 标签${NC}"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  current         显示当前版本号（从 version.md）"
    echo "  list            列出所有 Git 标签版本"
    echo "  tag             为当前提交创建版本标签（基于 version.md 最新版本）"
    echo "  tag [version]   为当前提交创建指定版本的标签"
    echo "  show [version]  显示指定版本的详细信息"
    echo "  checkout [v]    切换到指定版本（只读）"
    echo "  branch [v]      从指定版本创建新分支"
    echo "  diff [v1] [v2]  比较两个版本之间的差异"
    echo "  sync            推送标签到远程仓库"
    echo "  help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 current              # 查看当前版本"
    echo "  $0 tag                  # 为当前版本创建标签"
    echo "  $0 tag 6.3              # 为版本 6.3 创建标签"
    echo "  $0 show 6.2             # 查看版本 6.2 的详细信息"
    echo "  $0 checkout 6.2         # 切换到版本 6.2"
    echo ""
}

# 显示当前版本
show_current() {
    local version=$(get_latest_version)
    if [ -z "$version" ]; then
        echo -e "${RED}错误: 无法从 $VERSION_FILE 读取版本号${NC}"
        exit 1
    fi
    echo -e "${GREEN}当前版本: ${NC}v$version"
    
    # 显示版本描述的前几行
    local desc=$(get_version_description "$version")
    if [ -n "$desc" ]; then
        echo ""
        echo -e "${BLUE}版本描述:${NC}"
        echo "$desc" | head -5
    fi
}

# 列出所有标签
list_tags() {
    echo -e "${BLUE}所有版本标签:${NC}"
    git tag -l "v*" | sort -V -r | while read tag; do
        local commit=$(git rev-parse "$tag" 2>/dev/null)
        local date=$(git log -1 --format=%ai "$tag" 2>/dev/null)
        echo -e "  ${GREEN}$tag${NC} - $date - ${commit:0:8}"
    done
}

# 创建标签
create_tag() {
    local version=$1
    
    # 如果没有指定版本，从 version.md 读取
    if [ -z "$version" ]; then
        version=$(get_latest_version)
        if [ -z "$version" ]; then
            echo -e "${RED}错误: 无法从 $VERSION_FILE 读取版本号${NC}"
            echo "请使用: $0 tag [version]"
            exit 1
        fi
    fi
    
    local tag="v$version"
    
    # 检查标签是否已存在
    if git rev-parse "$tag" >/dev/null 2>&1; then
        echo -e "${YELLOW}警告: 标签 $tag 已存在${NC}"
        read -p "是否覆盖? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "已取消"
            exit 1
        fi
        git tag -d "$tag" >/dev/null 2>&1
    fi
    
    # 获取版本描述
    local desc=$(get_version_description "$version")
    local message="Version $version"
    if [ -n "$desc" ]; then
        message="$message

$desc"
    fi
    
    # 创建标签
    echo -e "${BLUE}正在创建标签: ${NC}$tag"
    git tag -a "$tag" -m "$message"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 标签 $tag 创建成功${NC}"
        echo ""
        echo "提示: 使用 '$0 sync' 推送到远程仓库"
    else
        echo -e "${RED}✗ 标签创建失败${NC}"
        exit 1
    fi
}

# 显示版本信息
show_version() {
    local version=$1
    if [ -z "$version" ]; then
        echo -e "${RED}错误: 请指定版本号${NC}"
        echo "用法: $0 show [version]"
        exit 1
    fi
    
    local tag="v$version"
    if ! git rev-parse "$tag" >/dev/null 2>&1; then
        echo -e "${RED}错误: 标签 $tag 不存在${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}版本信息: $tag${NC}"
    echo ""
    git show "$tag" --no-patch --format="%s%n%n%b" --date=format:"%Y-%m-%d %H:%M:%S" "$tag"
}

# 切换到版本
checkout_version() {
    local version=$1
    if [ -z "$version" ]; then
        echo -e "${RED}错误: 请指定版本号${NC}"
        exit 1
    fi
    
    local tag="v$version"
    if ! git rev-parse "$tag" >/dev/null 2>&1; then
        echo -e "${RED}错误: 标签 $tag 不存在${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}警告: 这将进入 detached HEAD 状态${NC}"
    echo -e "要返回主分支，使用: ${GREEN}git checkout main${NC}"
    read -p "继续? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout "$tag"
    fi
}

# 从版本创建分支
branch_from_version() {
    local version=$1
    if [ -z "$version" ]; then
        echo -e "${RED}错误: 请指定版本号${NC}"
        exit 1
    fi
    
    local tag="v$version"
    if ! git rev-parse "$tag" >/dev/null 2>&1; then
        echo -e "${RED}错误: 标签 $tag 不存在${NC}"
        exit 1
    fi
    
    read -p "新分支名称 (默认: branch-$version): " branch_name
    branch_name=${branch_name:-"branch-$version"}
    
    git checkout -b "$branch_name" "$tag"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 已从 $tag 创建分支 $branch_name${NC}"
    fi
}

# 比较版本
diff_versions() {
    local v1=$1
    local v2=$2
    
    if [ -z "$v1" ] || [ -z "$v2" ]; then
        echo -e "${RED}错误: 请指定两个版本号${NC}"
        echo "用法: $0 diff [version1] [version2]"
        exit 1
    fi
    
    local tag1="v$v1"
    local tag2="v$v2"
    
    if ! git rev-parse "$tag1" >/dev/null 2>&1; then
        echo -e "${RED}错误: 标签 $tag1 不存在${NC}"
        exit 1
    fi
    
    if ! git rev-parse "$tag2" >/dev/null 2>&1; then
        echo -e "${RED}错误: 标签 $tag2 不存在${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}比较 $tag1 和 $tag2:${NC}"
    git diff "$tag1" "$tag2" --stat
    echo ""
    read -p "显示完整差异? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git diff "$tag1" "$tag2"
    fi
}

# 推送标签到远程
sync_tags() {
    echo -e "${BLUE}推送所有标签到远程仓库...${NC}"
    git push origin --tags
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 标签推送成功${NC}"
    else
        echo -e "${RED}✗ 标签推送失败${NC}"
        exit 1
    fi
}

# 主函数
main() {
    cd "$SCRIPT_DIR" || exit 1
    
    case "${1:-help}" in
        current)
            show_current
            ;;
        list)
            list_tags
            ;;
        tag)
            create_tag "$2"
            ;;
        show)
            show_version "$2"
            ;;
        checkout)
            checkout_version "$2"
            ;;
        branch)
            branch_from_version "$2"
            ;;
        diff)
            diff_versions "$2" "$3"
            ;;
        sync)
            sync_tags
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}未知命令: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"

